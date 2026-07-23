import { z } from "zod"

/** Hard ceiling on page size, so a client cannot request the whole table. */
export const MAX_PAGE_SIZE = 100

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(MAX_PAGE_SIZE).default(25),
})

export type Pagination = z.infer<typeof paginationSchema>
