import { useSearchParams } from 'react-router-dom';

export default function Success() {
  // params from query string
  const [searchParams] = useSearchParams()
  const steamID = searchParams.get('steam_id')

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-green-100">
      <h1 className="text-4xl font-bold mb-4 text-green-800">Login Successful!</h1>
      <p className="text-lg text-green-600">You have successfully logged in with Steam.</p>
      <p className="text-lg text-green-600 mt-2">Your Steam ID: {steamID}</p>
    </div>
  );
}

