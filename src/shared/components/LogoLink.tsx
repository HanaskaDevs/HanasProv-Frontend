import { Link } from 'react-router-dom';
import { useAuth } from '../../modules/auth/hooks/useAuth';
import Logo from './Logo';

interface LogoLinkProps {
  className?: string;
  variant?: 'dark' | 'light';
}

export default function LogoLink({ className, variant }: LogoLinkProps) {
  const { isAuthenticated } = useAuth();

  return (
    <Link to={isAuthenticated ? '/panel' : '/'}>
      <Logo className={className} variant={variant} />
    </Link>
  );
}