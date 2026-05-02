// AppIcon — maps string icon name to a Lucide React icon component
import {
  Users, Clock, PlaneTakeoff, Wallet, BarChart2,
  Settings, CreditCard, Activity, Brain, Upload,
  Microscope, CheckCircle, FileText, Home, Bell,
} from 'lucide-react'

const iconMap = {
  Users,
  Clock,
  PlaneTakeoff,
  Wallet,
  BarChart2,
  Settings,
  CreditCard,
  Activity,
  Brain,
  Upload,
  Microscope,
  CheckCircle,
  FileText,
  Home,
  Bell,
}

export default function AppIcon({ name, className, ...props }) {
  const IconComponent = iconMap[name]
  if (!IconComponent) return null
  return <IconComponent className={className} {...props} />
}
