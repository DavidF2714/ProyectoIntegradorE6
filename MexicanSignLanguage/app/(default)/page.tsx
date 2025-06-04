import ProtectedHome from '@/components/ProtectedHome'
import SignIn from '../(auth)/signin/page'

export const metadata = {
  title: 'MonkeyPokedex',
  description: 'pokedex predictor',
}

export default function HomePage() {
  return <SignIn />
}
