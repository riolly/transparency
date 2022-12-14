/* eslint-disable unicorn/no-null */
import React from 'react'
import {useSession} from 'next-auth/react'
import {z} from 'zod'
import {useForm, useFieldArray, UseFormRegister} from 'react-hook-form'
import {zodResolver} from '@hookform/resolvers/zod'

import {trpc} from 'utils/trpc'

import DivAnimate from 'components/div-animate'
import QueryWrapper from 'components/query-wrapper'
import FormWrapper from 'components/form-wrapper'
import TextAreaInput from 'components/textarea-input'
import {Button, IconButton} from 'components/button'
import {SectionSeparator} from 'components/ornaments'
import {ErrorMessage} from '@hookform/error-message'
import {
	Bars3BottomLeftIcon,
	ChevronDownIcon,
	ChevronUpIcon,
	EllipsisHorizontalIcon,
	PlusIcon,
	TrashIcon,
} from '@heroicons/react/24/outline'

import {criteriaUpdateSchema} from 'types/criteria'
import {appCreateSchema, type AppType} from 'types/app'
import {type AppCriteria} from 'server/trpc/router/app-criteria'
import {type SubmitHandler} from 'react-hook-form'

const criteriaSchema = criteriaUpdateSchema
	.pick({id: true, type: true, parentId: true})
	.extend({
		checked: z.boolean(),
		explanation: z.string().nullable(),
	})
	.refine(
		(val) =>
			!(
				val.checked &&
				val.type === 'EXPLANATION' &&
				(val.explanation === null ||
					val.explanation === '' ||
					val.explanation?.length < 3)
			),
		{message: 'Provide more clear explanation', path: ['explanation']}
	)
const criteriasSchema = z.object({
	criteria: z
		.array(criteriaSchema)
		.refine((val) => val.some((item) => item.checked), 'Provide criteria'),
})
type CriteriaType = z.infer<typeof criteriaSchema>

export default function AppSection() {
	//	-----------------------   SCHEMA & TYPES   --------------------------- //
	const formSchema = appCreateSchema.merge(criteriasSchema)
	type FormType = z.infer<typeof formSchema>

	// ------------------------   INITIALIZE LIB   --------------------------- //
	const {data: auth} = useSession()

	const methods = useForm<FormType>({
		resolver: zodResolver(formSchema),
		defaultValues: {criteria: []},
	})
	useFieldArray<FormType>({control: methods.control, name: 'criteria'})
	const {
		register,
		reset,
		watch,
		setValue,
		formState: {errors},
	} = methods

	// ------------------------ QUERIES, MUTATIONS --------------------------- //
	const appSearchQ = trpc.useContext().app.search
	const appQ = trpc.app.fetchAll.useQuery()
	const criteriaQ = trpc.criteria.fetchRoot.useQuery(
		{noParent: false},
		{
			refetchOnWindowFocus: false,
			onSuccess: (data) => {
				for (const [i, criteria] of data.entries()) {
					setValue(`criteria.${i}.id`, criteria.id)
					setValue(`criteria.${i}.type`, criteria.type)
					setValue(`criteria.${i}.checked`, false)
					setValue(`criteria.${i}.explanation`, null)
				}
			},
		}
	)
	const {mutate: appCreate} = trpc.app.create.useMutation({
		onError: (err) => alert(err.message),
		onSuccess: () => {
			appSearchQ.invalidate()
			setIsCreate(false)
			reset()
		},
	})

	// ------------------------  VARIABLES, HOOKS  --------------------------- //
	const criteriaF = watch('criteria')
	const [isCreate, setIsCreate] = React.useState(false)

	// ------------------------   EVENT HANDLERS   --------------------------- //
	const onCreateApp: SubmitHandler<FormType> = (data) => {
		if (!auth?.user.id) return

		const criteria = data.criteria
			.filter((item) => item.checked)
			.map((item) => ({
				criteriaId: item.id,
				explanation: item.explanation,
				assignedBy: auth.user.id,
			}))

		appCreate({
			...data,
			criteria,
		})
	}

	return (
		<DivAnimate>
			{isCreate ? (
				<>
					<h1 className='mb-4 text-2xl'>Create new app</h1>

					<FormWrapper
						methods={methods}
						onValidSubmit={onCreateApp}
						className='flex flex-col'
					>
						<div className='mb-2 grid grid-cols-2 gap-x-8 gap-y-2'>
							<TextAreaInput<FormType> name='name' label='App name' rows={1} />
							<div />
							<TextAreaInput<FormType>
								name='company'
								label='Company name'
								rows={1}
							/>
							<TextAreaInput<FormType> name='headquarter' rows={1} />
							<TextAreaInput<FormType>
								name='registeredIn'
								label='Registered city'
								rows={1}
							/>
							<TextAreaInput<FormType> name='offices' rows={1} />
							<TextAreaInput<FormType>
								name='about'
								wrapperClassName='col-span-2'
							/>
						</div>

						<fieldset className='mt-6'>
							<SectionSeparator>Policy criteria</SectionSeparator>

							<QueryWrapper {...criteriaQ}>
								{(data) => (
									<div className='divide-y divide-gray-500/50 '>
										{data.map((criteria, i) => {
											const isChecked = criteriaF[i]?.checked
											const hasChildren = criteria.children.length > 0
											if (criteria.parentId) return
											return (
												<DivAnimate
													key={criteria.id}
													className='flex flex-col items-start py-3'
												>
													<input
														type='hidden'
														{...register(`criteria.${i}.id` as const)}
													/>
													<input
														type='hidden'
														{...register(`criteria.${i}.type` as const)}
													/>

													<CheckInput
														idx={i}
														register={register}
														criteria={criteria}
														criteriaForm={criteriaF}
													/>

													{isChecked && hasChildren && (
														<div className='w-full pl-7 pt-1'>
															{criteria.children.map((item) => {
																const idx = data.findIndex(
																	(c) => c.id === item.id
																)
																return (
																	<DivAnimate
																		key={item.id}
																		className='flex flex-col'
																	>
																		<CheckInput
																			idx={idx}
																			register={register}
																			criteria={item}
																			criteriaForm={criteriaF}
																		/>
																	</DivAnimate>
																)
															})}
														</div>
													)}
												</DivAnimate>
											)
										})}
									</div>
								)}
							</QueryWrapper>
							<ErrorMessage
								name='criteria'
								errors={errors}
								render={({message}) => (
									<small className='mt-0.5 font-medium text-red-500'>
										{message}
									</small>
								)}
							/>
						</fieldset>

						<div className='space-x-4 self-end'>
							<Button type='submit' variant='filled' className=''>
								Submit
							</Button>
							<Button
								type='reset'
								variant='outlined'
								className=''
								onClick={() => setIsCreate(false)}
							>
								Cancel
							</Button>
						</div>
					</FormWrapper>
				</>
			) : (
				<>
					<h1 className='mb-4 text-2xl'>
						App policy
						<IconButton
							className='ml-2 align-bottom'
							onClick={() => setIsCreate(true)}
						>
							<PlusIcon className='h-6 w-6 text-brand-300 ' />
						</IconButton>
					</h1>

					<QueryWrapper {...appQ}>
						{(data) => (
							<div className='space-y-1'>
								{data.map((app) => (
									<AppItem key={app.id} appData={app} />
								))}
							</div>
						)}
					</QueryWrapper>
				</>
			)}
		</DivAnimate>
	)
}

const AppItem = ({appData: appP}: {appData: AppType}) => {
	// ------------------------   SCHEMA & TYPES   --------------------------- //
	const formSchema = appCreateSchema.merge(criteriasSchema)
	type FormType = z.infer<typeof formSchema>

	// ------------------------   INITIALIZE LIB   --------------------------- //
	const methods = useForm<FormType>({
		resolver: zodResolver(formSchema),
		defaultValues: {...appP, criteria: []},
	})
	useFieldArray<FormType>({control: methods.control, name: 'criteria'})
	const {
		watch,
		register,
		reset,
		formState: {dirtyFields, isDirty},
	} = methods

	// ------------------------ QUERIES, MUTATIONS --------------------------- //
	const appSearchQ = trpc.useContext().app.search
	const appQ = trpc.app.fetchAll.useQuery(undefined, {
		refetchOnWindowFocus: false,
	})
	const criteriaQ = trpc.criteria.fetchRoot.useQuery(
		{noParent: false},
		{refetchOnWindowFocus: false}
	)
	const appCriteriaQ = trpc.appCriteria.fetch.useQuery(
		{appId: appP.id},
		{initialData: appP.AppCriteria, refetchOnWindowFocus: false}
	)

	const appUpdate = trpc.app.update.useMutation({
		onSuccess: () => {
			appQ.refetch()
			appSearchQ.invalidate()
		},
	})
	const appRemove = trpc.app.delete.useMutation({
		onSuccess: () => {
			appQ.refetch()
			appSearchQ.invalidate()
		},
	})
	const criteriaUpdate = trpc.appCriteria.update.useMutation({
		onSuccess: () => {
			appCriteriaQ.refetch()
		},
	})

	// ------------------------  VARIABLES, HOOKS  --------------------------- //
	const criteriaF = watch('criteria')
	const [isExpanded, setIsExpanded] = React.useState(false)
	const [isEdit, setIsEdit] = React.useState(false)

	const defaultCriteria = React.useMemo(() => {
		const result: CriteriaType[] = []

		if (criteriaQ.data && appCriteriaQ.data) {
			for (const criteria of criteriaQ.data) {
				const appCriteria = appCriteriaQ.data.find(
					(item) => item.criteriaId === criteria.id
				)
				result.push({
					id: criteria.id,
					parentId: criteria.parentId,
					checked: !!appCriteria,
					explanation: appCriteria ? appCriteria.explanation : null,
					type: criteria.type,
				})
			}
		}
		return result
	}, [criteriaQ.data, appCriteriaQ.data])

	React.useEffect(() => {
		if (
			criteriaF.length <= 0 ||
			appUpdate.isSuccess ||
			criteriaUpdate.isSuccess
		) {
			reset({...appP, criteria: defaultCriteria})
		}
	}, [
		appP,
		appUpdate.isSuccess,
		criteriaF.length,
		criteriaUpdate.isSuccess,
		defaultCriteria,
		reset,
	])

	// ------------------------   EVENT HANDLERS   --------------------------- //
	const onEditApp: SubmitHandler<FormType> = (form) => {
		const {criteria: formCriteria, ...formApp} = form
		const {criteria: criteriaDirtyFields, ...appDirtyFields} = dirtyFields

		if (isEdit && Object.keys(appDirtyFields).length > 0) {
			appUpdate.mutate({id: appP.id, ...formApp})
		}

		if (criteriaDirtyFields) {
			const upsert: AppCriteria[] = []
			const remove: AppCriteria[] = []

			for (const [i, criteria] of formCriteria.entries()) {
				if (criteriaDirtyFields?.[i]) {
					const appCriteria = {
						criteriaId: criteria.id,
						explanation: criteria.explanation,
						appId: appP.id,
					}
					if (criteria.checked) {
						upsert.push(appCriteria)
					} else {
						remove.push(appCriteria)
					}
				}
			}

			criteriaUpdate.mutate({upsert, remove})
		}
	}

	return (
		<div className='flex rounded-lg bg-dark-bg/25 py-3 px-2'>
			<IconButton onClick={() => setIsExpanded(!isExpanded)} className='h-fit'>
				{isExpanded ? (
					<ChevronUpIcon className='h-6 w-6' />
				) : (
					<ChevronDownIcon className='h-6 w-6' />
				)}
			</IconButton>

			<DivAnimate className='flex flex-1 flex-col justify-start'>
				<div className='flex items-center justify-between'>
					<div
						className='space-y-0.5 hover:cursor-pointer'
						onClick={() => setIsExpanded(!isExpanded)}
					>
						<h2 className='leading-5 md:text-lg md:leading-normal'>
							{appP.name}
						</h2>
						<p className='text-xs text-light-body/75'>{appP.company}</p>
					</div>
					<IconButton>
						<TrashIcon
							className='h-6 w-6 text-red-500'
							onClick={() => appRemove.mutate({id: appP.id})}
						/>
					</IconButton>
				</div>

				<FormWrapper
					className='pr-2'
					methods={methods}
					onValidSubmit={onEditApp}
				>
					{isExpanded && (
						<IconButton className='absolute -right-0 z-10'>
							<EllipsisHorizontalIcon
								className='h-6 w-6 text-brand-600'
								onClick={() => setIsEdit(!isEdit)}
							/>
						</IconButton>
					)}
					<DivAnimate>
						{isEdit && isExpanded && (
							<div className='my-2 grid grid-cols-2 gap-x-8 gap-y-2 '>
								<TextAreaInput<FormType>
									name='name'
									label='App name'
									defaultValue={appP.name}
									rows={1}
								/>
								<div />
								<TextAreaInput<FormType>
									name='company'
									label='Company name'
									defaultValue={appP.company}
									rows={1}
								/>
								<TextAreaInput<FormType>
									name='headquarter'
									rows={1}
									defaultValue={appP.headquarter ?? ''}
								/>
								<TextAreaInput<FormType>
									name='registeredIn'
									label='Registered city'
									defaultValue={appP.registeredIn ?? ''}
									rows={1}
								/>
								<TextAreaInput<FormType>
									name='offices'
									rows={1}
									defaultValue={appP.offices ?? ''}
								/>
								<TextAreaInput<FormType>
									name='about'
									defaultValue={appP.about}
									wrapperClassName='col-span-2'
								/>
							</div>
						)}
					</DivAnimate>

					<QueryWrapper {...criteriaQ}>
						{(data) => (
							<div className='w-full divide-y divide-gray-500/50 '>
								{data.map((criteria, i) => {
									const isChecked = criteriaF[i]?.checked
									const hasChildren = criteria.children.length > 0
									if (criteria.parentId || !isExpanded) return
									return (
										<DivAnimate
											key={`${appP.id}_${criteria.id}`}
											className='flex flex-col items-start py-2'
										>
											<input
												type='hidden'
												{...methods.register(`criteria.${i}.id` as const)}
											/>
											<input
												type='hidden'
												{...methods.register(`criteria.${i}.parentId` as const)}
											/>
											<input
												type='hidden'
												{...methods.register(`criteria.${i}.type` as const)}
											/>
											<CheckInput
												idx={i}
												criteriaForm={criteriaF}
												criteria={criteria}
												register={register}
											/>

											{isChecked && hasChildren && (
												<div className='w-full pl-6 pt-1'>
													{criteria.children.map((item) => {
														const idx = data.findIndex((c) => c.id === item.id)
														return (
															<DivAnimate
																key={`${appP.id}_${item.id}`}
																className='flex flex-col'
															>
																<CheckInput
																	idx={idx}
																	register={register}
																	criteriaForm={criteriaF}
																	criteria={item}
																/>
															</DivAnimate>
														)
													})}
												</div>
											)}
										</DivAnimate>
									)
								})}
							</div>
						)}
					</QueryWrapper>

					{isDirty && isExpanded && (
						<div className='float-right space-x-1 '>
							<Button
								type='submit'
								variant='filled'
								className='px-2 py-1'
								isLoading={criteriaUpdate.isLoading || appUpdate.isLoading}
							>
								Save
							</Button>
							<Button
								type='reset'
								variant='outlined'
								className='px-2 py-0.5'
								onClick={() => reset()}
							>
								Cancel
							</Button>
						</div>
					)}
				</FormWrapper>
			</DivAnimate>
		</div>
	)
}

const CheckInput = ({
	idx,
	criteria,
	criteriaForm,
	register,
}: {
	idx: number
	criteriaForm: Array<{checked: boolean}>
	criteria: {
		id: string
		value: string
		type: 'EXPLANATION' | 'TRUE_FALSE'
		children?: Array<unknown>
	}
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	register: UseFormRegister<any>
}) => {
	const methods = register(`criteria.${idx}.checked` as const)

	return (
		<>
			<div className='flex gap-2'>
				<div className='mt-0.5 flex h-5 items-center'>
					<input
						id={`criteria-${criteria.id}`}
						type='checkbox'
						className='h-4 w-4 rounded border-gray-300 text-brand-600 hover:cursor-pointer focus:ring-brand-500'
						{...methods}
					/>
				</div>
				<div className='min-w-0 items-start'>
					<label
						htmlFor={`criteria-${criteria.id}`}
						className='select-none font-medium hover:cursor-pointer'
					>
						{criteria.value}
					</label>
					{criteria.type === 'EXPLANATION' && (
						<Bars3BottomLeftIcon className='ml-2 inline h-5 w-5 align-middle text-brand-100' />
					)}
					{criteria.children && criteria.children.length > 0 && (
						<ChevronDownIcon className='ml-2 inline h-5 w-5 align-middle text-brand-100' />
					)}
				</div>
			</div>
			{criteriaForm[idx]?.checked && criteria.type === 'EXPLANATION' && (
				<TextAreaInput
					name={`criteria.${idx}.explanation`}
					label=''
					wrapperClassName='w-full pl-6 pt-1 pb-2'
				/>
			)}
		</>
	)
}
