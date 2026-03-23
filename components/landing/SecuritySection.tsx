const SECURITY_POINTS = [
  { iconLabel: 'LK', title: 'Cifrado AES-256', description: 'Tus claves se cifran antes de ser almacenadas.' },
  { iconLabel: 'SV', title: 'Solo en servidor', description: 'Las claves nunca viajan al cliente en texto plano.' },
  { iconLabel: 'EY', title: 'Nunca expuestas', description: 'Las respuestas de API tampoco contienen las claves.' },
]

export function SecuritySection() {
  return (
    <section className="w-full py-20 flex justify-center">
      <div className="container px-4 md:px-6 lg:max-w-5xl flex flex-col items-center gap-12">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-20 h-20 rounded-3xl bg-accent-subtle flex items-center justify-center text-accent">
            <span className="text-2xl font-bold">SC</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-text-primary">
            Tus API Keys, solo tuyas
          </h2>
          <p className="max-w-xl text-text-secondary md:text-lg text-balance">
            Kami Prompter usa <span className="text-text-primary font-medium">Supabase Vault</span> para cifrar tus claves en reposo. Nunca se exponen al navegador ni a terceros.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full">
          {SECURITY_POINTS.map(point => {
            return (
              <div
                key={point.title}
                className="flex flex-col items-center text-center p-6 rounded-xl bg-surface border border-border gap-3"
              >
                <div className="w-10 h-10 rounded-lg bg-accent-subtle flex items-center justify-center text-accent">
                  <span className="text-xs font-semibold">{point.iconLabel}</span>
                </div>
                <p className="text-sm font-semibold text-text-primary">{point.title}</p>
                <p className="text-xs text-text-secondary">{point.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
