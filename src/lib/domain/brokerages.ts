import { z } from "zod";

import { type Database, db } from "@/lib/db";
import { brokerageCodeSchema } from "@/lib/domain/types";

const brokerageSchema = z.object({
  code: brokerageCodeSchema,
  name: z.string().min(1),
});

export type Brokerage = Readonly<z.infer<typeof brokerageSchema>>;

export async function listBrokerages(database: Database = db): Promise<readonly Brokerage[]> {
  const result: unknown = await database`
    SELECT code, name FROM brokerages ORDER BY code
  `;
  return z.array(brokerageSchema).parse(result);
}
