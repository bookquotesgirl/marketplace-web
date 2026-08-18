import Login from './Login';

// /register renders the same combined auth page with the register tab pre-selected.
export default function Register() {
  return <Login defaultMode="register" />;
}
