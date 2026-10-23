import { Redirect } from 'expo-router';

// The browser preview can load at an unexpected path; send it home.
export default function NotFound() {
  return <Redirect href="/" />;
}
