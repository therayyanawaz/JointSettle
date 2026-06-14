import { prisma } from '@/lib/prisma'
import { randomId } from '@/lib/api'

const HASH_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
const HASH_LENGTH = 8

export function generateHash(): string {
  let hash = ''
  for (let i = 0; i < HASH_LENGTH; i++) {
    hash += HASH_CHARS.charAt(Math.floor(Math.random() * HASH_CHARS.length))
  }
  return hash
}

export async function createUser(): Promise<{ id: string; hash: string }> {
  let hash: string
  let attempts = 0

  // Keep generating until we find a unique hash
  do {
    hash = generateHash()
    attempts++
    if (attempts > 100) {
      // Extremely unlikely, but just in case
      hash = generateHash() + Date.now().toString(36)
    }
  } while (await prisma.user.findUnique({ where: { hash } }))

  const user = await prisma.user.create({
    data: {
      id: randomId(),
      hash,
    },
  })

  return { id: user.id, hash: user.hash }
}

export async function getUserByHash(hash: string) {
  return prisma.user.findUnique({ where: { hash } })
}

export async function verifyUserAuthenticated(hash: string): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { hash } })
  return user !== null
}

export async function verifyGroupOwnership(hash: string, groupId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { hash } })
  if (!user) return false
  const group = await prisma.group.findFirst({
    where: { id: groupId, userId: user.id },
  })
  return group !== null
}
