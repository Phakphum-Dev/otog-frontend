import clsx from 'clsx'
import Head from 'next/head'
import { Dispatch, SetStateAction, forwardRef, memo, useState } from 'react'
import { FaPuzzlePiece } from 'react-icons/fa'

import { ProblemWithSubmission } from '../types'

import { AnnouncementCarousel } from '@src/announcement/components/AnnouncementCarousel'
import { getAnnouncements } from '@src/announcement/queries'
import { ClientOnly } from '@src/components/ClientOnly'
import { PageContainer } from '@src/components/layout/PageContainer'
import { Title, TitleLayout } from '@src/components/layout/Title'
import { useAuth } from '@src/context/AuthContext'
import { withCookies } from '@src/context/HttpClient'
import { FilterFunction, ProblemTable } from '@src/problem/ProblemTable'
import { useProblems } from '@src/problem/queries'
import { Button, ButtonProps } from '@src/ui/Button'
import { ONE_DAY } from '@src/utils/time'

export default function ProblemPage() {
  const { isAuthenticated } = useAuth()
  const [filter, setFilter] = useState<FilterFunction>(
    () => filterButton[0].filter
  )

  return (
    <PageContainer maxSize="md">
      <Head>
        <title>Problem | OTOG</title>
      </Head>
      <AnnouncementCarousel />
      <TitleLayout>
        <Title icon={<FaPuzzlePiece />}>โจทย์</Title>
      </TitleLayout>
      {isAuthenticated && <Buttons setFilter={setFilter} />}
      <ClientOnly>
        <ProblemTable filter={filter} />
      </ClientOnly>
    </PageContainer>
  )
}

export interface ButtonsProps {
  setFilter: Dispatch<SetStateAction<FilterFunction>>
}

export const Buttons = memo((props: ButtonsProps) => {
  const { setFilter } = props
  const { data: problems, isLoading } = useProblems()
  return (
    <div className="mb-4 flex space-x-2 md:space-x-3">
      {filterButton.map(({ filter, ...props }) => (
        <OtogButton
          key={props.colorScheme}
          onClick={() => setFilter(() => filter)}
          isLoading={isLoading}
          number={problems?.filter(filter).length}
          {...props}
        />
      ))}
    </div>
  )
})

type OtogButton = ButtonProps & {
  label: string
  isLoading: boolean
  number?: number
}

const OtogButton = forwardRef<HTMLButtonElement, OtogButton>(
  ({ label, number, colorScheme, isLoading, ...props }, ref) => {
    return (
      <Button
        className={clsx(
          'aspect-5/4 h-full flex-1 flex-col rounded-lg',
          isLoading && 'animate-pulse'
        )}
        colorScheme={isLoading ? 'gray' : colorScheme}
        {...props}
        ref={ref}
      >
        <h6 className="hidden text-base sm:mb-2 sm:block md:text-lg">
          {!isLoading && label}
        </h6>
        <h3 className="text-3xl font-bold md:text-4xl">{number}</h3>
      </Button>
    )
  }
)

const filterButton = [
  {
    filter: () => true,
    colorScheme: 'gray',
    label: 'ทั้งหมด',
  },
  {
    filter: (problem: ProblemWithSubmission) =>
      problem.submission?.status === 'accept',
    colorScheme: 'otog-green',
    label: 'ผ่านแล้ว',
  },
  {
    filter: (problem: ProblemWithSubmission) =>
      problem.submission?.status === 'reject',
    colorScheme: 'otog-red',
    label: 'ยังไม่ผ่าน',
  },
  {
    filter: (problem: ProblemWithSubmission) => !problem.submission?.id,
    colorScheme: 'otog-orange',
    label: 'ยังไม่ส่ง',
  },
  {
    filter: (problem: ProblemWithSubmission) =>
      problem.show &&
      Date.now() - new Date(problem.recentShowTime).getTime() < ONE_DAY,
    colorScheme: 'otog-blue',
    label: 'โจทย์วันนี้',
  },
] as const

export const getServerSideProps = withCookies(async () => {
  const announcement = getAnnouncements()
  return {
    props: {
      fallback: {
        announcement: await announcement,
      },
    },
  }
})
