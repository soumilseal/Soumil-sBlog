import { Blog } from '../types';

export const INITIAL_BLOGS: Blog[] = [
  {
    id: 'seed-blog-1',
    title: 'The Architecture of Solitude: Designing Mental Sanctuaries in an Hyperconnected Age',
    excerpt: 'In a world humming with notifications and relentless algorithmic dopamine, intentional isolation has transitioned from a monk’s indulgence to a creative survival tool.',
    content: `## The Continuous Hum of the Machine

We awaken to luminescent rectangular slabs pulsing with messages from people we have never met, reacting to events we cannot influence, consuming emotions formulated to maximize outrage. Modern life rarely grants us quietude; instead, silence has been pathologized as dead air, something to be filled immediately with a podcast, a video, or an infinite scroll.

Yet every monumental discovery in mathematics, every transcendent novel, and every philosophical revolution emerged not in the cacophony of a town square, but in the quiet cathedrals of personal solitude.

### The Sanctuary Principle

To build a mental sanctuary does not require retreating to an Alaskan log cabin or discarding your smartphone into a river. Rather, it requires establishing cognitive boundary zones:

1. **Temporal Boundaries:** Protecting the first ninety minutes of morning consciousness from external data ingestion.
2. **Physical Geography:** Dedicating a singular physical chair or corner strictly to contemplative reading and analog writing.
3. **Intentional Boredom:** Allowing the mind to sit without stimulation long enough for subconscious ideation to spark into conscious thought.

> "Solitude is not the absence of energy or action, but rather a wild state of communion with one’s own untamed subconscious."

When you silence the chorus of external opinions, you finally hear the faint melody of your genuine convictions. Build your sanctuary before the digital noise claims your last original thought.`,
    coverImage: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1200&q=80',
    authorId: 'system-author-1',
    authorName: 'Elena Rostova',
    authorUsername: 'elenarostova',
    authorPhotoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    category: 'philosophy',
    tags: ['Mindfulness', 'DeepWork', 'Solitude', 'Philosophy'],
    readTimeMinutes: 6,
    status: 'published',
    likesCount: 142,
    commentsCount: 28,
    bookmarksCount: 64,
    viewsCount: 1240,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(), // 18 hours ago
  },
  {
    id: 'seed-blog-2',
    title: 'Beyond Transformers: The Quest for Neuromorphic & Symbiotic Machine Intelligence',
    excerpt: 'As large language models approach parameter scaling plateaus, frontier AI researchers are rediscovering biological principles of neuroplasticity, analog computing, and low-energy cognition.',
    content: `## The Energetic Dilemma of Silicon Giants

Current frontier foundation models demand gigawatts of power, liquid cooling facilities the size of airport hangars, and billions of dollars in clustered hardware. Compare that to the human brain: roughly 20 watts of biochemical energy, operating on warm glucose and water, capable of real-time sensory synthesis, emotional empathy, and creative leaps.

The architectural bottleneck is the Von Neumann architecture: the ceaseless shuttling of data between processing cores and memory arrays.

### The Neuromorphic Paradigm

Instead of simulating neurons on discrete floating-point arrays, neuromorphic systems compute through physical spikes, where memory and calculation co-locate in memristive substrates.

Key breakthroughs reshaping the next decade:
- **Event-Driven Spiking Networks:** Processing sensory data strictly when state delta occurs.
- **Continuous Local Adaptation:** Models that learn on-device without full backpropagation passes.
- **Hybrid Photonic-Electronic Interconnects:** Routing optical matrix operations at the speed of light.

\`\`\`python
# Conceptual Spiking Synapse Activation
def process_synaptic_event(voltage, threshold, refractory_period):
    if voltage >= threshold and not in_refractory(refractory_period):
        emit_spike_pulse()
        reset_membrane_potential()
        trigger_hebbian_potentiation()
\`\`\`

The future of intelligence will not be a singular monolithic datacenter, but a distributed tapestry of symbiotic agents embedded directly in the fabric of human artifacts.`,
    coverImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
    authorId: 'system-author-2',
    authorName: 'Dr. Marcus Vance',
    authorUsername: 'marcusvance',
    authorPhotoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    category: 'technology',
    tags: ['ArtificialIntelligence', 'Neuromorphic', 'DeepTech', 'Future'],
    readTimeMinutes: 8,
    status: 'published',
    likesCount: 289,
    commentsCount: 54,
    bookmarksCount: 198,
    viewsCount: 3120,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(), // 1.5 days ago
  },
  {
    id: 'seed-blog-3',
    title: 'The Poetry of Glass and Shadows: Exploring Neo-Brutalist & Cyber-Editorial Aesthetics',
    excerpt: 'Why modern digital design is abandoning flat sterility in favor of high-contrast typography, luminescent specular gradients, and cinematic spatial depth.',
    content: `## The Great Flatness Has Run Its Course

For over a decade, digital interfaces succumbed to a uniform corporate minimalism: sanitized gray cards, pastel pill badges, timid 14px typography, and timid drop-shadows. Every SaaS application began to resemble an administrative healthcare spreadsheet.

A quiet rebellion is flourishing among independent designers, digital artists, and creative publications.

### The Pillars of Cyber-Editorial Design

1. **Dramatic Typographic Scale:** Pairing majestic serif headlines (like Playfair or Didot) with ultra-dense monospace metadata labels.
2. **True Glassmorphism:** Not merely blur filters, but chromatic aberration, refractive specular highlights, and internal noise grain.
3. **Cinematic Dark Canvases:** Deep obsidian (#060911) backgrounds that allow cyan, violet, and champagne light sources to breathe.

> "A great interface is not an invisible tool; it is an atmospheric space that honors the dignity of the thoughts expressed within it."

When designing for long-form literature, every pixel should feel as tactile and deliberate as ink pressed upon heavy handmade linen.`,
    coverImage: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=1200&q=80',
    authorId: 'system-author-3',
    authorName: 'Aria Chen',
    authorUsername: 'ariachen_design',
    authorPhotoURL: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80',
    category: 'design',
    tags: ['UIUX', 'DesignSystems', 'Typography', 'Cyberpunk'],
    readTimeMinutes: 5,
    status: 'published',
    likesCount: 95,
    commentsCount: 16,
    bookmarksCount: 42,
    viewsCount: 890,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(), // 3 days ago
  },
  {
    id: 'seed-blog-4',
    title: 'Echoes from Europa’s Subsurface Ocean: What Planetary Astrobiology Teaches Us About Hope',
    excerpt: 'Beneath thirty kilometers of cracked ice on Jupiter’s sixth moon lies more liquid saltwater than all of Earth’s oceans combined. The implications of life existing in perpetual darkness.',
    content: `## The Geysers of the Outer Solar System

When Galileo Galilei pointed his crude optical tube toward Jupiter in 1610, he saw four faint specks of light orbiting the gas giant. Four centuries later, interplanetary probes detected hydrothermal venting roaring from the basalt seabed of Europa.

Earth life was long assumed to be sun-worshiping. Photosynthesis seemed the absolute non-negotiable spark for complexity. That dogma shattered at the bottom of the Mariana Trench, where chemosynthetic tubeworms and extremophiles thrive in sulfuric superheated plumes.

### The Psychological Mirror of Astrobiology

Why does the search for alien microbes grip the human imagination so profoundly?

Because to find life flourishing in the frigid, radiation-blasted abyss of Jupiter’s gravity well is proof that **vitality is not a fragile anomaly**. Life is an inevitable thermodynamic imperative of the universe.

As we deploy the Europa Clipper and subsequent robotic cryobots, we are not merely seeking exobiological DNA; we are seeking reassurance that consciousness is not an orphaned whisper in an indifferent cosmic night.`,
    coverImage: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
    authorId: 'system-author-4',
    authorName: 'Prof. Julian Sterling',
    authorUsername: 'juliansterling',
    authorPhotoURL: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
    category: 'future',
    tags: ['Astronomy', 'SpaceExploration', 'Astrobiology', 'Cosmology'],
    readTimeMinutes: 7,
    status: 'published',
    likesCount: 312,
    commentsCount: 41,
    bookmarksCount: 120,
    viewsCount: 2450,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(), // 4 days ago
  },
  {
    id: 'seed-blog-5',
    title: 'The Art of the First Sentence: How Great Storytellers Seize the Soul',
    excerpt: 'An autopsy of the opening lines of Garcia Marquez, Camus, Woolf, and Morrison, and how to craft an irrevocable hook that compels the reader forward.',
    content: `## The Irrevocable Contract

The opening sentence of an essay, novel, or memoir is not a polite introduction; it is a contract signed in blood. In that solitary breath, the reader decides whether to give you five minutes of their non-renewable earthly existence.

Consider Albert Camus in *The Stranger*:
> "Mother died today. Or maybe yesterday; I can’t be sure."

Notice what happens: within eleven words, Camus dismantles conventional emotional expectations, establishes an unsettling psychological dissonance, and forces you to demand an explanation.

### The Mechanics of the Magnetic Hook

1. **Introduce a contradiction:** State two truths that seem incompatible on their surface.
2. **Anchor in sensory immediacy:** Avoid vague generalities; drop the reader directly onto wet cobblestones or into a room smelling of burnt copper.
3. **Promise high stakes:** Let the reader intuit that something irreplaceable is hanging in the balance.

As you sit down before the empty editor screen on Soumil's Blog, do not clear your throat with polite disclaimers. Light the match immediately.`,
    coverImage: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80',
    authorId: 'system-author-1',
    authorName: 'Elena Rostova',
    authorUsername: 'elenarostova',
    authorPhotoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    category: 'creative-writing',
    tags: ['WritingCraft', 'Storytelling', 'Literature', 'Essay'],
    readTimeMinutes: 4,
    status: 'published',
    likesCount: 187,
    commentsCount: 33,
    bookmarksCount: 91,
    viewsCount: 1780,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 120).toISOString(), // 5 days ago
  }
];
