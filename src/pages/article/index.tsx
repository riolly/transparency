import Link from 'next/link'
import dayjs from 'dayjs'

import {trpc} from '@utils/trpc'

import PlainLayout from 'layouts/nav-top'
import GlassContainerLayout from 'layouts/glass-container'
import QueryWrapper from '@components/query-wrapper'

import {useForm, type SubmitHandler} from 'react-hook-form'
import {zodResolver} from '@hookform/resolvers/zod'

import FormWrapper from '@components/form-wrapper'
import TextAreaInput from '@components/textarea-input'
import Button from '@components/button'
import {MdCreate as CreateIcon} from 'react-icons/md'

import {
	CreateArticleSchema,
	type CreateArticleType,
	type ArticleType,
} from '@type/article'

export default function ArticlePage() {
	const articlesQuery = trpc.article.fetchAll.useQuery()

	return (
		<div className='space-y-8'>
			<h1 className='text-3xl text-gray-50'>Articles</h1>
			<QueryWrapper {...articlesQuery}>
				{(articles) => (
					<div className='grid grid-cols-3 gap-4'>
						{articles.map((article) => (
							<Card key={article.id} {...article} />
						))}
					</div>
				)}
			</QueryWrapper>
			<CreateArticleForm refetchList={articlesQuery.refetch} />
		</div>
	)
}

const Card = ({slug, title, content, createdAt}: ArticleType) => {
	return (
		<Link
			href={`./article/${slug}`}
			className={`hover:glass max-h-96 space-y-2 overflow-hidden rounded-lg border-2 border-white/25 bg-white/10 p-6 transition-colors`}
		>
			<div className='flex flex-col'>
				<h2 className='border-b-[1px] pb-1 text-xl text-gray-50 line-clamp-2'>
					{title}
				</h2>
				<time className='self-end border-t-2 pl-1 text-sm text-gray-200'>
					{dayjs(createdAt).format('MMM D, YYYY')}
				</time>
			</div>
			<p className='text-gray-200 line-clamp-6'>{content}</p>
		</Link>
	)
}

const CreateArticleForm = ({refetchList}: {refetchList: () => void}) => {
	const methods = useForm<CreateArticleType>({
		mode: 'onTouched',
		resolver: zodResolver(CreateArticleSchema),
	})

	const {mutate, isLoading} = trpc.article.create.useMutation({
		onError: (error) => {
			let message = error.message
			if (error.data?.code === 'UNAUTHORIZED') {
				message = 'You have to logged in to create article.'
			}
			alert(message)
		},
		onSuccess: () => {
			refetchList()
			methods.reset()
		},
	})

	const onValidSubmit: SubmitHandler<CreateArticleType> = (data) => {
		mutate(data)
	}

	return (
		<div className='grid grid-cols-6'>
			<FormWrapper
				methods={methods}
				onValidSubmit={onValidSubmit}
				className='col-span-full flex flex-col gap-4 md:col-span-4'
			>
				<TextAreaInput name='title' />
				<TextAreaInput name='content' rows={5} />
				<Button
					type='submit'
					variant='outlined'
					isLoading={isLoading}
					className='w-fit text-gray-200'
				>
					Create <CreateIcon className='text-lg text-white' />
				</Button>
			</FormWrapper>
		</div>
	)
}

ArticlePage.getLayout = function getLayout(page: React.ReactElement) {
	return (
		<PlainLayout>
			<GlassContainerLayout>{page}</GlassContainerLayout>
		</PlainLayout>
	)
}
