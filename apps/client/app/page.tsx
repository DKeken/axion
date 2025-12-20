import Link from "next/link";

export default function Home() {
  return (
    <div>
      <div className="text-center py-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Welcome to Axion Stack
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
          Visual design and automatic generation of microservice architecture
        </p>
        <div className="flex justify-center space-x-4">
          <Link
            href="/projects"
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            View Projects
          </Link>
          <Link
            href="/infrastructure"
            className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Infrastructure
          </Link>
          <Link
            href="/deployments"
            className="px-6 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700"
          >
            Deployments
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Graph Editor
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Create and edit your microservice architecture visually using React
            Flow
          </p>
        </div>
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Code Generation
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Automatically generate code from your graph using AI-powered codegen
          </p>
        </div>
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Deployment
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Deploy your services to infrastructure with automated deployment
            pipelines
          </p>
        </div>
      </div>
    </div>
  );
}
