'use client';

import { useState } from 'react';
import { Form, Input, Button, message, Typography } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { login, login_bg } from '@/images';
import { supabaseClient } from '@/lib/superbaseClient';

const { Title } = Typography;

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const router = useRouter();

  const onFinish = async (values: { email: string; password: string }) => {
    try {
      setLoading(true);
      const { error } = await supabaseClient.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) {
        message.error(error.message);
        return;
      }

      message.success('Login successful');
      router.push('/dashboard');
    } catch (error) {
      message.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        backgroundImage: `url(${login_bg.src})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
      className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8"
    >
      <div className="w-[900px]">
        <div className="grid grid-cols-2">
          <div className="flex flex-col gap-5 p-6 my-8 rounded-l-xl font-roboto bg-white/60">
            <div>
              <Title className="font-roboto" level={2}>
                Đăng nhập
              </Title>
              <p className="text-gray-600">
                Chào mừng trở lại, vui lòng đăng nhập vào tài khoản của bạn.
              </p>
            </div>
            <Form
              form={form}
              name="login"
              initialValues={{ remember: true }}
              onFinish={onFinish}
              layout="vertical"
              size="large"
            >
              <Form.Item
                name="email"
                rules={[
                  { required: true, message: 'Vui lòng nhập email!' },
                  { type: 'email', message: 'Vui lòng nhập email hợp lệ!' },
                ]}
              >
                <Input prefix={<UserOutlined />} placeholder="Nhập email ..." />
              </Form.Item>

              <Form.Item
                name="password"
                rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="Nhập mật khẩu ..."
                  className="font-roboto"
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  block
                  className="font-roboto"
                >
                  Đăng nhập
                </Button>
              </Form.Item>
            </Form>
          </div>
          <div>
            <Image
              src={login.src}
              height={500}
              width={500}
              alt="login"
              className="w-full h-full rounded-r-xl object-cover"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
