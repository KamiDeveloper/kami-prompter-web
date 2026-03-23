const FEATURES = [
  {
    iconLabel: 'IM',
    title: 'Improver',
    description: 'Mejora prompts existentes con técnicas avanzadas de prompt engineering en segundos. Elige entre perfiles rápidos o profundos.',
  },
  {
    iconLabel: 'BL',
    title: 'Builder',
    description: 'Construye prompts desde cero utilizando metodologías comprobadas como el formato CREDO para resultados óptimos.',
  },
  {
    iconLabel: 'PR',
    title: 'PRD Maker',
    description: 'Genera Documentos de Requerimientos de Producto (PRDs) completos a partir de una idea simple. Exporta fácilmente a Markdown.',
  },
  {
    iconLabel: 'LB',
    title: 'Library & Templates',
    description: 'Guarda tus mejores prompts. Organízalos por categorías, gestiona versiones (ramas) y reútilizalos en cualquier momento.',
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="w-full py-20 bg-surface-raised border-y border-border flex justify-center">
      <div className="container px-4 md:px-6 lg:max-w-7xl">
        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-text-primary">
            Todo lo que necesitas para Engineering
          </h2>
          <p className="max-w-175 text-text-secondary md:text-lg">
            Herramientas especializadas para garantizar que tus interacciones con IA sean consistentes y precisas.
          </p>
        </div>
        <div className="mx-auto grid max-w-5xl items-center gap-6 lg:grid-cols-2 lg:gap-12">
          {FEATURES.map(feature => {
            return (
              <div
                key={feature.title}
                className="flex flex-col p-8 rounded-xl bg-surface border border-border shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-accent-subtle text-sm font-semibold text-accent">
                  {feature.iconLabel}
                </div>
                <h3 className="text-xl font-bold text-text-primary">{feature.title}</h3>
                <p className="text-text-secondary mt-2">{feature.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
