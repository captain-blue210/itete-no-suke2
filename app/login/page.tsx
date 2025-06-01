import { Metadata } from 'next';
import { LoginForm } from '@/components/features/LoginForm';

export const metadata: Metadata = {
  title: 'ログイン | いててのすけ',
  description: 'いててのすけにログインして痛みの記録を管理しましょう',
};

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          いててのすけ
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          痛みの記録と管理
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <LoginForm />
      </div>
    </div>
  );
}