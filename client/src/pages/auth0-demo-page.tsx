import Auth0Demo from "@/components/auth0-demo";

export default function Auth0DemoPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6 text-center">Auth0 Authentication Demo</h1>
      <div className="max-w-md mx-auto">
        <Auth0Demo />
      </div>
      <div className="mt-8 text-center text-sm text-gray-500">
        <p>This demo shows how to use Auth0 for phone authentication in your application.</p>
        <p className="mt-2">
          <a href="/" className="text-blue-500 hover:underline">
            Return to main application
          </a>
        </p>
      </div>
    </div>
  );
} 