'use client'

import { useActionState, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  connectWhatsappNumber,
  verifyWhatsappNumber,
  disconnectWhatsappNumber,
  type WhatsappState,
} from '@/app/actions/whatsapp'

type WhatsappRecord = {
  phoneNumber: string
  displayName: string | null
  status: string
  verificationCode: string | null
} | null

const initialState: WhatsappState = {}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    connected: { label: 'Conectado', className: 'bg-primary text-primary-foreground' },
    pending: { label: 'Aguardando verificação', className: 'bg-accent text-accent-foreground' },
  }
  const item = map[status] ?? { label: status, className: 'bg-muted text-muted-foreground' }
  return (
    <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${item.className}`}>
      {item.label}
    </span>
  )
}

export function WhatsappConnect({ record }: { record: WhatsappRecord }) {
  const router = useRouter()
  const [connectState, connectAction, connecting] = useActionState(
    connectWhatsappNumber,
    initialState,
  )
  const [verifyState, verifyAction, verifying] = useActionState(
    verifyWhatsappNumber,
    initialState,
  )
  const [disconnecting, setDisconnecting] = useState(false)

  async function handleDisconnect() {
    setDisconnecting(true)
    await disconnectWhatsappNumber()
    setDisconnecting(false)
    router.refresh()
  }

  const isConnected = record?.status === 'connected'
  const isPending = record?.status === 'pending'

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-foreground">
            Número de WhatsApp
          </h2>
          <p className="mt-1 text-sm text-muted-foreground leading-relaxed text-pretty">
            Vincule o número que receberá e responderá as mensagens dos seus clientes.
          </p>
        </div>
        {record ? <StatusBadge status={record.status} /> : null}
      </div>

      {isConnected ? (
        <div className="mt-5 flex flex-col gap-4">
          <div className="rounded-lg border border-border p-4">
            <p className="text-sm font-medium text-foreground">{record?.phoneNumber}</p>
            {record?.displayName ? (
              <p className="mt-1 text-sm text-muted-foreground">{record.displayName}</p>
            ) : null}
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={handleDisconnect}
            disabled={disconnecting}
            className="w-full sm:w-auto"
          >
            {disconnecting ? 'Removendo...' : 'Desconectar número'}
          </Button>
        </div>
      ) : (
        <div className="mt-5 flex flex-col gap-6">
          <form action={connectAction} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="phoneNumber">Número (com DDI e DDD)</Label>
              <Input
                id="phoneNumber"
                name="phoneNumber"
                inputMode="tel"
                placeholder="+55 11 91234-5678"
                defaultValue={record?.phoneNumber ?? ''}
                required
                className="text-base"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="displayName">Nome de exibição (opcional)</Label>
              <Input
                id="displayName"
                name="displayName"
                placeholder="Atendimento da Loja"
                defaultValue={record?.displayName ?? ''}
                className="text-base"
              />
            </div>
            {connectState.error ? (
              <p className="text-sm text-destructive">{connectState.error}</p>
            ) : null}
            {connectState.success ? (
              <p className="text-sm text-primary">{connectState.success}</p>
            ) : null}
            <Button type="submit" disabled={connecting} className="w-full sm:w-auto">
              {connecting ? 'Salvando...' : record ? 'Atualizar número' : 'Salvar número'}
            </Button>
          </form>

          {isPending ? (
            <div className="rounded-lg border border-border p-4">
              <p className="text-sm font-medium text-foreground">
                Confirme o código de verificação
              </p>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed text-pretty">
                Digite o código de 6 dígitos para ativar o número.
                {record?.verificationCode ? (
                  <>
                    {' '}
                    Durante o desenvolvimento, seu código é{' '}
                    <span className="font-mono font-semibold text-foreground">
                      {record.verificationCode}
                    </span>
                    .
                  </>
                ) : null}
              </p>
              <form action={verifyAction} className="mt-4 flex flex-col gap-3 sm:flex-row">
                <Input
                  name="code"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="000000"
                  required
                  className="text-base"
                />
                <Button type="submit" disabled={verifying} className="shrink-0">
                  {verifying ? 'Verificando...' : 'Verificar'}
                </Button>
              </form>
              {verifyState.error ? (
                <p className="mt-3 text-sm text-destructive">{verifyState.error}</p>
              ) : null}
              {verifyState.success ? (
                <p className="mt-3 text-sm text-primary">{verifyState.success}</p>
              ) : null}
            </div>
          ) : null}
        </div>
      )}
    </Card>
  )
}
