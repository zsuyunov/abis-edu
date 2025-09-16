import { headers, cookies } from "next/headers";

// Simple JWT decoder for debugging
function decodeJWT(token: string) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    return payload;
  } catch (error) {
    console.error('JWT decode error:', error);
    return null;
  }
}

export default async function DebugAuthPage() {
  const headersList = headers();
  const cookieStore = cookies();
  
  // Get from middleware headers
  const role = headersList.get("x-user-role");
  const userId = headersList.get("x-user-id");
  const phone = headersList.get("x-user-phone");
  const name = headersList.get("x-user-name");
  const surname = headersList.get("x-user-surname");
  const branchId = headersList.get("x-branch-id");
  
  // Get from cookies directly
  const authToken = cookieStore.get("auth_token")?.value;
  const userIdFromCookie = cookieStore.get("userId")?.value;
  
  // Decode JWT token directly
  const jwtPayload = authToken ? decodeJWT(authToken) : null;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Authentication Debug</h1>
      
      <div className="bg-gray-100 p-4 rounded mb-4">
        <h2 className="text-lg font-semibold mb-2">Headers from Middleware:</h2>
        <ul className="space-y-1">
          <li><strong>Role:</strong> {role || "Not set"}</li>
          <li><strong>User ID:</strong> {userId || "Not set"}</li>
          <li><strong>Phone:</strong> {phone || "Not set"}</li>
          <li><strong>Name:</strong> {name || "Not set"}</li>
          <li><strong>Surname:</strong> {surname || "Not set"}</li>
          <li><strong>Branch ID:</strong> {branchId || "Not set"}</li>
        </ul>
      </div>
      
      <div className="bg-blue-100 p-4 rounded mb-4">
        <h2 className="text-lg font-semibold mb-2">Direct JWT Token Decoding:</h2>
        <ul className="space-y-1">
          <li><strong>Auth Token Found:</strong> {authToken ? "Yes" : "No"}</li>
          <li><strong>User ID from Cookie:</strong> {userIdFromCookie || "Not set"}</li>
          <li><strong>JWT Payload:</strong></li>
        </ul>
        {jwtPayload ? (
          <pre className="text-sm bg-white p-2 rounded mt-2">
            {JSON.stringify(jwtPayload, null, 2)}
          </pre>
        ) : (
          <p className="text-red-600">Failed to decode JWT token</p>
        )}
      </div>
      
      <div className="mt-4">
        <h2 className="text-lg font-semibold mb-2">All Headers:</h2>
        <div className="bg-gray-100 p-4 rounded">
          <pre className="text-sm">
            {JSON.stringify(Object.fromEntries(headersList.entries()), null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
