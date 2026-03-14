import { Client } from "@elastic/elasticsearch"
import "dotenv/config"

export const esClient = new Client({
  node: process.env.ELASTICSEARCH_URL!,
  auth: { apiKey: process.env.ELASTICSEARCH_API_KEY! },
})

export async function createUsersIndex() {
  const exists = await esClient.indices.exists({ index: "users" })
  if (exists) return

  await esClient.indices.create({
    index: "users",
    mappings: {
      properties: {
        userId:   { type: "keyword" },
        location: { type: "geo_point" },
        vector:   { type: "dense_vector", dims: 20, index: true, similarity: "cosine" },
        updatedAt:{ type: "date" },
      },
    },
  })

  console.log("Users index created.")
}