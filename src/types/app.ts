import {z} from 'zod'
import {RouterOutputs} from 'utils/trpc'

const criteriaSchema = z.object({
	id: z.string(),
	explanation: z.string().optional(),
})

export const appCreateSchema = z.object({
	name: z.string().min(3, 'Provide more descriptive app name'),
	company: z.string().min(3, 'Provide more descriptive company name'),
	headquarter: z.string().optional(),
	registeredIn: z.string().optional(),
	offices: z.string().optional(),
	about: z.string().optional(),
	criteria: z.array(criteriaSchema).min(1),
})

export const appUpdateSchema = appCreateSchema.extend({
	id: z.string(),
})

export type AppCreateType = z.infer<typeof appCreateSchema>
export type AppUpdateType = z.infer<typeof appUpdateSchema>
export type AppType = Exclude<RouterOutputs['app']['fetchOne'], null>