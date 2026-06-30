import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { SignOutButton } from '@/components/sign-out-button'

type RoadmapStep = {
  title: string
  description: string
  status: 'done' | 'next' | 'todo'
}

const roadmap: RoadmapStep[] = [
  {
    title: 'Cadastro e login',
    description: 'Conta com e-mail e senha, sessão persistida no banco.',
    status: 'done',
  },
  {
    title: 'Conectar número de WhatsApp',
    description: 'Vincular um número para receber e responder mensagens.',
    status: 'next',
  },
  {
    title: 'Respostas com IA',
    description: 'Gerar respostas automáticas para as mensagens recebidas.',
    status: 'todo',
  },
  {
    title: 'Assinatura (Stripe)',
    description: 'Cobrança recorrente para liberar os recursos pagos.',
    status: 'todo',
  },
]

const statusLabel: Record<RoadmapStep['status'], string> = {
  done: 'Pronto',
  next: 'Próximo',
  todo: 'A fazer',
}

const statusClass: Record<RoadmapStep['status'], string> = {
  done: 'bg-primary text-primary-foreground',
  next: 'bg-accent text-accent-foreground',
  todo: 'bg-muted text-muted-foreground',
}

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/sign-in')

  const { name, email } = session.user

  return (
    <main className="min-h-svh bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-4">
          <div>
            <p className="text-sm text-muted-foreground">Painel</p>
            <h1 className="text-lg font-semibold text-foreground">
              {name}
            </h1>
          </div>
          <SignOutButton />
        </div>
      </header>

      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8">
        <Card className="p-6">
          <h2 className="text-base font-semibold text-foreground">
            Sua conta
          </h2>
          <dl className="mt-4 flex flex-col gap-3">
            <div className="flex items-center justify-between gap-4 border-b border-border pb-3">
              <dt className="text-sm text-muted-foreground">Nome</dt>
              <dd className="text-sm font-medium text-foreground">{name}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-sm text-muted-foreground">E-mail</dt>
              <dd className="text-sm font-medium text-foreground">{email}</dd>
            </div>
          </dl>
        </Card>

        <Card className="p-6">
          <h2 className="text-base font-semibold text-foreground">
            Roteiro do produto
          </h2>
          <p className="mt-1 text-sm text-muted-foreground leading-relaxed text-pretty">
            Cada etapa é entregue e verificada antes de avançar para a próxima.
          </p>
          <ol className="mt-5 flex flex-col gap-3">
            {roadmap.map((step) => (
              <li
                key={step.title}
                className="flex items-start justify-between gap-4 rounded-lg border border-border p-4"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {step.title}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground leading-relaxed text-pretty">
                    {step.description}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${statusClass[step.status]}`}
                >
                  {statusLabel[step.status]}
                </span>
              </li>
            ))}
          </ol>
        </Card>
      </div>
    </main>
  )
}
