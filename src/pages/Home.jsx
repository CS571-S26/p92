import steam_login from './../assets/steam_login.png';

export default function Home() {


  function handleSteamLogin() {
    window.location.href = '/api/auth/steam';
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <h1 className="text-4xl font-bold mb-4">Welcome to the Home Page</h1>
      <p className="text-lg text-gray-600">This is the home page of our application.</p>

      <button
        type="submit"
        className="mt-6 px-4 py-2 w-20 rounded justify-center items-center hover:bg-gray-300"
        onClick={handleSteamLogin}
      >

        <img src={steam_login} alt="Steam Login" />
      </button>
    </div>
  );
}
