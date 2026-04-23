"use client";

import { useQuery } from '@tanstack/react-query';
import { useTRPC } from "@/trpc/client";
import { useAuth } from "@/context/AuthContext";

export default function AuthTestPage() {
  const { user, loading } = useAuth();
  const trpc = useTRPC();
  
  // Call the protected .me procedure - this will only succeed with valid JWT
  const meQuery = useQuery({
    ...trpc.me.queryOptions(),
    // Only run when we have a Firebase user
    enabled: !!user,
  });

  // Call the public hello procedure - this always works
  const helloQuery = useQuery(trpc.hello.queryOptions());

  if (loading) {
    return <div className="p-8">Loading auth...</div>;
  }

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Firebase Auth Test</h1>
      
      {/* Public Procedure Test */}
      <div className="mb-8 p-4 bg-gray-100 rounded">
        <h2 className="font-semibold mb-2">Public Procedure (hello)</h2>
        {helloQuery.isLoading && <p>Loading...</p>}
        {helloQuery.error && (
          <p className="text-red-500">Error: {helloQuery.error.message}</p>
        )}
        {helloQuery.data && (
          <p className="text-green-700">✅ {helloQuery.data.message}</p>
        )}
      </div>

      {/* Protected Procedure Test */}
      <div className="mb-8 p-4 bg-gray-100 rounded">
        <h2 className="font-semibold mb-2">Protected Procedure (me)</h2>
        
        {!user && (
          <p className="text-orange-600">⚠️ Not logged in - sign in to test JWT verification</p>
        )}
        
        {user && meQuery.isLoading && <p>Verifying JWT...</p>}
        
        {user && meQuery.error && (
          <div className="text-red-500">
            <p>❌ JWT Verification Failed</p>
            <p className="text-sm">{meQuery.error.message}</p>
          </div>
        )}
        
        {user && meQuery.data && (
          <div className="text-green-700">
            <p>✅ JWT Valid!</p>
            <pre className="mt-2 p-2 bg-white rounded text-sm overflow-auto">
              {JSON.stringify(meQuery.data, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Current User Status */}
      <div className="p-4 border rounded">
        <h2 className="font-semibold mb-2">Firebase Auth Status</h2>
        {user ? (
          <div>
            <p className="text-green-600">✅ Logged in as: {user.email}</p>
            <p className="text-sm text-gray-600">UID: {user.uid}</p>
          </div>
        ) : (
          <p className="text-gray-600">Not logged in</p>
        )}
      </div>
    </div>
  );
}