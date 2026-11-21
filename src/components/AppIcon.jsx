import {
  Aperture,
  Box,
  Camera,
  ChefHat,
  Clapperboard,
  Cpu,
  FileText,
  Globe,
  GraduationCap,
  Languages,
  Megaphone,
  Mic,
  MonitorCog,
  Palette,
  PenTool,
  Printer,
  Radio,
  ShieldCheck,
  ShoppingCart,
  Store,
  Sun,
  TrendingUp,
  Video,
} from 'lucide-react'

/**
 * Maps a plain-string icon name (kept in src/data/content.js)
 * to its matching lucide-react component.
 * Unknown names gracefully fall back to the palette icon.
 */
const ICON_MAP = {
  aperture: Aperture,
  box: Box,
  camera: Camera,
  chefhat: ChefHat,
  clapperboard: Clapperboard,
  cpu: Cpu,
  filetext: FileText,
  globe: Globe,
  graduationcap: GraduationCap,
  languages: Languages,
  megaphone: Megaphone,
  mic: Mic,
  monitorcog: MonitorCog,
  palette: Palette,
  pentool: PenTool,
  printer: Printer,
  radio: Radio,
  shieldcheck: ShieldCheck,
  shoppingcart: ShoppingCart,
  store: Store,
  sun: Sun,
  trendingup: TrendingUp,
  video: Video,
}

export default function AppIcon({ name, ...props }) {
  const key = String(name || '')
    .replace(/[^a-z0-9]/gi, '')
    .toLowerCase()
  const Icon = ICON_MAP[key] || Palette
  return <Icon {...props} />
}