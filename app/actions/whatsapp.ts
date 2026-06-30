'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { whatsappNumber } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Não autorizado')
  return session.user.id
}

export type WhatsappState = {
  error?: string
  success?: string
}

function normalizePhone(raw: string) {
  // Mantém apenas dígitos e um eventual "+" inicial.
  const trimmed = raw.trim()
  const digits = trimmed.replace(/[^\d]/g, '')
  return trimmed.startsWith('+') ? `+${digits}` : digits
}

export async function getWhatsappNumber() {
  const userId = await getUserId()
  const rows = await db
    .select()
    .from(whatsappNumber)
    .where(eq(whatsappNumber.userId, userId))
    .limit(1)
  return rows[0] ?? null
}

export async function connectWhatsappNumber(
  _prev: WhatsappState,
  formData: FormData,
): Promise<WhatsappState> {
  const userId = await getUserId()

  const phoneRaw = String(formData.get('phoneNumber') ?? '')
  const displayName = String(formData.get('displayName') ?? '').trim() || null
  const phoneNumber = normalizePhone(phoneRaw)

  const digitCount = phoneNumber.replace(/[^\d]/g, '').length
  if (digitCount < 10 || digitCount > 15) {
    return { error: 'Informe um número válido com DDI e DDD, ex.: +55 11 91234-5678.' }
  }

  // Código de 6 dígitos. Quando integrarmos o provedor de WhatsApp,
  // este código será enviado por mensagem em vez de exibido na tela.
  const verificationCode = String(Math.floor(100000 + Math.random() * 900000))

  const existing = await db
    .select()
    .from(whatsappNumber)
    .where(eq(whatsappNumber.userId, userId))
    .limit(1)

  if (existing[0]) {
    await db
      .update(whatsappNumber)
      .set({
        phoneNumber,
        displayName,
        status: 'pending',
        verificationCode,
        updatedAt: new Date(),
      })
      .where(eq(whatsappNumber.userId, userId))
  } else {
    await db.insert(whatsappNumber).values({
      id: crypto.randomUUID(),
      userId,
      phoneNumber,
      displayName,
      status: 'pending',
      verificationCode,
    })
  }

  revalidatePath('/')
  return { success: 'Número salvo. Confirme o código de verificação para ativar.' }
}

export async function verifyWhatsappNumber(
  _prev: WhatsappState,
  formData: FormData,
): Promise<WhatsappState> {
  const userId = await getUserId()
  const code = String(formData.get('code') ?? '').trim()

  const rows = await db
    .select()
    .from(whatsappNumber)
    .where(eq(whatsappNumber.userId, userId))
    .limit(1)
  const record = rows[0]

  if (!record) return { error: 'Nenhum número cadastrado.' }
  if (record.status === 'connected') return { success: 'Número já verificado.' }
  if (!record.verificationCode || code !== record.verificationCode) {
    return { error: 'Código incorreto. Verifique e tente novamente.' }
  }

  await db
    .update(whatsappNumber)
    .set({ status: 'connected', verificationCode: null, updatedAt: new Date() })
    .where(eq(whatsappNumber.userId, userId))

  revalidatePath('/')
  return { success: 'WhatsApp conectado com sucesso!' }
}

export async function disconnectWhatsappNumber(): Promise<void> {
  const userId = await getUserId()
  await db.delete(whatsappNumber).where(eq(whatsappNumber.userId, userId))
  revalidatePath('/')
}
