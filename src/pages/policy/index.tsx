/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable unicorn/no-useless-undefined */
import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import dayjs from 'dayjs'

import {trpc} from 'utils/trpc'
import {slugify} from 'utils/literal'
import {useDebounceState} from 'utils/hooks/use-debounce'
import useDeviceDetect from 'utils/hooks/use-device-detect'

import NavbarLayout from 'layouts/navbar'
import MetaHead from 'components/meta-head'
import DivAnimate from 'components/div-animate'
import PaginationNav from 'components/pagination-nav'
import {Button, IconButton} from 'components/button'
import {
	LoadingPlaceholder,
	ErrorPlaceholder,
	EmptyPlaceholder,
} from 'components/query-wrapper'
import {TriangleSymbol} from 'components/ornaments'
import {
	CheckIcon,
	LinkIcon,
	MinusIcon,
	PuzzlePieceIcon,
	XMarkIcon,
} from '@heroicons/react/24/outline'

import {type AppType} from 'types/app'
import {useAutoAnimate} from '@formkit/auto-animate/react'
import {CriteriaComparisonType} from 'types/criteria'
import {ArrayElement} from 'types/general'
import {Transition, Dialog} from '@headlessui/react'

const PER_PAGE = 8

type IdName = {id: string; name: string}

export default function SideBar() {
	const [page, setPage] = React.useState(1)
	const [searchQuery, setSearchQuery] = useDebounceState<string | undefined>(
		undefined,
		350
	)

	const appQuery = trpc.app.search.useInfiniteQuery(
		{query: searchQuery, dataPerPage: PER_PAGE},
		{
			staleTime: 60_000,
			refetchOnWindowFocus: false,
			getNextPageParam: (lastPage) => lastPage.nextCursor,
		}
	)
	const {hasNextPage, fetchNextPage, data, isLoading, isError, error, refetch} =
		appQuery

	const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setSearchQuery(e.target.value === '' ? undefined : e.target.value)
	}

	const device = useDeviceDetect()

	const [appsToCompare, setAppsToCompare] = React.useState<Array<IdName>>([])
	const appIds = appsToCompare.map((item) => item.id)

	const addToComparison = (app: IdName) =>
		setAppsToCompare([...appsToCompare, app])
	const removeFromComparison = (app: IdName) =>
		setAppsToCompare([...appsToCompare].filter((item) => item.id !== app.id))

	const {
		refetch: compareApps,
		isFetching: isComparisonLoading,
		data: comparisonData,
	} = trpc.criteria.compareApps.useQuery(
		{appIds},
		{enabled: false, onSuccess: () => setIsOpen(true)}
	)

	const [isOpen, setIsOpen] = React.useState(false)

	return (
		<>
			<MetaHead
				title='App Policy'
				description='Search for app policy'
				imageUrl={`https://${process.env.NEXT_PUBLIC_VERCEL_URL}/images/articles.jpg`}
			/>
			<main className='container mx-auto space-y-8 px-5 pt-8 md:px-8'>
				<div className='mx-auto max-w-screen-lg space-y-2'>
					<h1 className='text-2xl'>Search for app policy</h1>
					<DivAnimate className='grid grid-cols-2 gap-4'>
						<DivAnimate className='col-span-full flex gap-2 md:col-span-1'>
							<input
								className='h-10 flex-1 p-2 placeholder:font-body placeholder:text-sm placeholder:italic'
								onChange={onChange}
								placeholder='name, company, keyword...'
							/>
							{appsToCompare.length > 1 && (
								<Button
									variant='filled'
									className='px-2.5 py-1 md:hidden'
									isLoading={isComparisonLoading}
									onClick={() => compareApps()}
								>
									Compare
								</Button>
							)}
						</DivAnimate>

						{appsToCompare.length > 1 && (
							<Button
								variant='filled'
								className='ml-auto hidden px-3 py-1.5 md:block'
								isLoading={isComparisonLoading}
								onClick={() => compareApps()}
							>
								Compare
							</Button>
						)}
					</DivAnimate>
				</div>

				<DivAnimate className='mx-auto max-w-screen-lg'>
					{isLoading ? (
						<LoadingPlaceholder label='app policies' />
					) : isError ? (
						<ErrorPlaceholder error={error} refetch={refetch} />
					) : data.pages[0]?.items.length === 0 ? (
						<EmptyPlaceholder label='app policy' />
					) : (
						<React.Fragment>
							{device.isPhone ? (
								<DivAnimate className='space-y-4'>
									{data.pages.map(({items}) =>
										items.map((item) => (
											<Card
												key={item.id}
												app={item}
												disabled={appIds.length === 2}
												checked={appIds.includes(item.id)}
												addToComparison={addToComparison}
												removeFromComparison={removeFromComparison}
											/>
										))
									)}

									{hasNextPage && (
										<div className='flex justify-center'>
											<button
												onClick={() => fetchNextPage()}
												className='rounded-lg bg-white/20 px-4 py-2'
											>
												Load more ..
											</button>
										</div>
									)}
								</DivAnimate>
							) : (
								<DivAnimate>
									{data.pages.map(({items, nextCursor}, i) => {
										if (i + 1 !== page) return
										return (
											<div
												className='grid grid-cols-4 gap-4'
												key={`section_md_${nextCursor}`}
											>
												{items.map((item) => (
													<Card
														key={item.id}
														className='col-span-2'
														app={item}
														disabled={appIds.length === 3}
														checked={appIds.includes(item.id)}
														addToComparison={addToComparison}
														removeFromComparison={removeFromComparison}
													/>
												))}
											</div>
										)
									})}
									<PaginationNav
										{...{page, setPage, hasNextPage, fetchNextPage}}
									/>
								</DivAnimate>
							)}
						</React.Fragment>
					)}
				</DivAnimate>

				<Modal isOpen={isOpen} setIsOpen={setIsOpen}>
					<ul className='relative max-w-screen-2xl rounded-lg bg-gradient-to-br from-brand-700 via-brand-900 to-dark-bg py-6 pl-4 pr-4 md:pl-2'>
						<div className='absolute right-0 top-0 h-full w-[calc((100%-12px)*0.66)] rounded bg-dark-bg/10 md:w-[calc((100%-30px)*0.75)]' />
						<div className='absolute right-0 top-0 z-20'>
							<IconButton onClick={() => setIsOpen(false)}>
								<XMarkIcon className='w-6 md:w-8' />
							</IconButton>
						</div>
						<div className='relative grid grid-cols-3 md:grid-cols-4 md:pl-8'>
							<div />
							{appsToCompare.map((app) => {
								return (
									<div
										key={app.id}
										className='text-center leading-4 md:leading-5'
									>
										<Link
											href={`./policy/${slugify(app.name, app.id)}`}
											className='font-heading text-xs font-bold text-light-body underline hover:cursor-pointer hover:underline-offset-4 md:text-base'
										>
											{app.name}
										</Link>
									</div>
								)
							})}
						</div>
						{comparisonData?.map((comparisonCriteria) => (
							<CriteriaList
								key={comparisonCriteria.id}
								criteria={comparisonCriteria}
							/>
						))}
					</ul>
				</Modal>
			</main>
		</>
	)
}

const Card = ({
	app,
	className,
	checked,
	disabled,
	addToComparison,
	removeFromComparison,
}: {
	app: Omit<AppType, 'AppCriteria'>
	className?: string
	checked: boolean
	disabled: boolean
	addToComparison: (id: IdName) => void
	removeFromComparison: (id: IdName) => void
}) => {
	const logo = ''

	const onCheck = (e: React.MouseEvent<HTMLInputElement, MouseEvent>) => {
		e.stopPropagation()
		if (e.currentTarget.checked) {
			addToComparison(app)
		} else {
			removeFromComparison(app)
		}
	}

	return (
		<Link
			href={`./policy/${slugify(app.name, app.id)}`}
			className={`hover:shadow-bg-light min-h-48 relative flex max-h-60 flex-col overflow-hidden rounded rounded-br-3xl rounded-tl-2xl border border-light-head/25 bg-light-head bg-opacity-20 p-6 pb-4 duration-100 hover:bg-opacity-30 hover:shadow-lg ${className}`}
		>
			<div className='absolute top-0 left-0'>
				<div className='flex rounded-br-xl bg-dark-bg/30 shadow'>
					<div className='flex w-16 items-center justify-center'>
						{/* <StarIcon className='text-sm text-yellow-300' /> */}
					</div>
					<div className='py-0.5 px-4 text-sm text-light-head'>
						<time className='font-body text-sm italic'>
							{dayjs(app.updatedAt).format('MMM D, YYYY')}
						</time>
					</div>
				</div>
				<div className='flex h-14 w-16 items-center justify-center rounded-br-xl bg-light-bg/50 shadow-xl'>
					{logo ? (
						<Image
							className='h-full w-full rounded-tl-lg rounded-br-xl object-cover'
							src={logo}
							alt='author picture'
							width={72}
							height={72}
						/>
					) : (
						<PuzzlePieceIcon className='-mt-0.5 -ml-0.5 h-9 w-9 text-gray-700' />
					)}
				</div>
			</div>
			<div className='absolute right-2 top-2'>
				<input
					type='checkbox'
					onClick={onCheck}
					defaultChecked={checked}
					disabled={disabled && !checked}
					className='h-4 w-4 rounded-lg border-gray-300 text-brand-600 hover:cursor-pointer focus:ring-brand-500'
				/>
			</div>
			<div className='mt-1 h-fit w-full text-xl text-light-head'>
				<div className='float-left mr-2 h-12 w-12' />
				<h2 className=''>{app.name}</h2>
				<div className='mt-0.5 flex h-1 items-center gap-2'>
					<div className='h-[1px] w-auto grow rounded-full bg-brand-500/50' />
					<TriangleSymbol className='' />
				</div>
				<p className='float-right mr-5 text-sm italic'>{app.company}</p>
			</div>

			<p className='h-full pt-4 text-right indent-12 leading-5 text-light-body line-clamp-4 md:line-clamp-3 '>
				{app.about}
			</p>
		</Link>
	)
}

type CriteriaLisProps =
	| {
			criteria: Omit<ArrayElement<CriteriaComparisonType>, 'children'>
			sub: true
	  }
	| {
			sub?: false
			criteria: ArrayElement<CriteriaComparisonType>
	  }
const CriteriaList = ({criteria, sub}: CriteriaLisProps) => {
	const hasChildren = sub ? false : criteria.children.length > 0
	const [isExpanded, setIsExpanded] = React.useState(false)

	const [refAnimate] = useAutoAnimate<HTMLUListElement>()

	const onExpand = () => {
		if (hasChildren) {
			setIsExpanded(!isExpanded)
		}
	}

	return (
		<li
			className={`
				group relative flex list-none items-start gap-2
				${sub ? 'group/sub py-0.5 first:mt-1 last:mb-2' : 'py-1 md:py-2'}
			`}
		>
			{!sub && (
				<TriangleSymbol
					onClick={onExpand}
					className={`
						-ml-4 w-4 transition-transform hover:cursor-pointer md:ml-0 md:w-6
						${hasChildren ? 'visible' : 'invisible'}
						${isExpanded ? 'mt-6 -rotate-90 md:mt-4' : '-mt-1.5 -rotate-180 md:mt-0.5'}
					`}
				/>
			)}
			<div className='w-full'>
				<div
					className={`
						grid grid-cols-12 border-b-[1px] border-brand-100 border-opacity-50 pb-1 transition-all
						${sub ? 'rounded border-dashed hover:pl-2 group-hover/sub:bg-brand-100/50' : ''}
					`}
				>
					<h3
						onClick={onExpand}
						className={`
							col-span-4 leading-3 transition-all md:col-span-3 md:leading-5
							${hasChildren ? 'hover:cursor-pointer' : ''}
							${
								sub
									? 'text-xs font-normal '
									: 'text-xs font-medium group-hover:font-semibold md:text-base md:group-hover:text-lg md:group-hover:leading-6'
							}
						`}
					>
						{criteria.value}
					</h3>

					{criteria.comparison.map(({checked, explanation, appId}) => (
						<div
							className='col-span-4 flex h-full justify-center px-2 md:col-span-3'
							key={`${appId}_${criteria.id}_checked`}
						>
							{checked && (
								<>
									{criteria.type === 'TRUE_FALSE' && (
										<div
											className={`
												flex justify-center
												${
													sub
														? 'mr-2 h-6 w-8'
														: `h-8 w-8 ${
																isExpanded && hasChildren
																	? 'invisible'
																	: 'visible'
														  }`
												} 
											`}
										>
											<CheckIcon
												className={`
													transition-all
													${
														sub
															? 'w-5 text-brand-400 group-hover/sub:text-white'
															: 'w-6 text-brand-200 group-hover:w-8 group-hover:text-white'
													}
												`}
											/>
										</div>
									)}
									{criteria.type === 'EXPLANATION' && (
										<p className='w-full text-center text-xs leading-3 group-hover:font-semibold md:leading-normal'>
											{explanation?.includes('http') ? (
												<a href={explanation} target='_blank' rel='noreferrer'>
													<span className='hidden truncate md:block'>
														{explanation}
													</span>
													<LinkIcon className='mx-auto w-5 text-light-body md:hidden' />
												</a>
											) : (
												<span className='whitespace-pre-wrap break-words'>
													{explanation}
												</span>
											)}
										</p>
									)}
								</>
							)}
							{!checked && (
								<div
									className={`
										flex justify-center
										${sub ? 'mr-2 h-6 w-8' : `h-8 w-8 ${isExpanded ? 'invisible' : 'visible'}`} 
									`}
								>
									<MinusIcon
										className={`
											transition-all
											${
												sub
													? 'w-5 text-gray-500/75 group-hover/sub:text-gray-300'
													: 'w-6 text-gray-500/75 group-hover:w-8 group-hover:text-gray-300'
											}
										`}
									/>
								</div>
							)}
						</div>
					))}
				</div>

				<ul ref={refAnimate}>
					{isExpanded &&
						hasChildren &&
						!sub &&
						criteria.children.map((child) => (
							<CriteriaList key={child.id} criteria={child} sub />
						))}
				</ul>
			</div>
		</li>
	)
}

function Modal({
	isOpen,
	setIsOpen,
	children,
}: {
	isOpen: boolean
	setIsOpen: React.Dispatch<React.SetStateAction<boolean>>
	children: React.ReactNode
}) {
	return (
		<Transition appear show={isOpen} as={React.Fragment}>
			<Dialog
				as='div'
				className='relative z-10'
				onClose={() => setIsOpen(false)}
			>
				<Transition.Child
					as={React.Fragment}
					enter='ease-out duration-300'
					enterFrom='opacity-0'
					enterTo='opacity-100'
					leave='ease-in duration-200'
					leaveFrom='opacity-100'
					leaveTo='opacity-0'
				>
					<div className='fixed inset-0 bg-black bg-opacity-25' />
				</Transition.Child>

				<div className='fixed inset-0 overflow-y-auto'>
					<div className='flex min-h-full items-center justify-center py-16 md:px-4 md:py-20'>
						<Transition.Child
							as={React.Fragment}
							enter='ease-out duration-300'
							enterFrom='opacity-0 scale-95'
							enterTo='opacity-100 scale-100'
							leave='ease-in duration-200'
							leaveFrom='opacity-100 scale-100'
							leaveTo='opacity-0 scale-95'
						>
							{children}
						</Transition.Child>
					</div>
				</div>
			</Dialog>
		</Transition>
	)
}

SideBar.getLayout = (page: React.ReactElement) => (
	<NavbarLayout>{page}</NavbarLayout>
)
