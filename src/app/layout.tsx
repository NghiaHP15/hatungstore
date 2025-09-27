/* eslint-disable @next/next/no-page-custom-font */
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { ConfigProvider } from 'antd';

const inter = Inter({ subsets: ['latin'], });

export const metadata: Metadata = {
  title: 'Grocery Store Management System',
  description: 'A comprehensive grocery store management system',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
       <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Oswald:wght@200..700&family=Roboto+Condensed:ital,wght@0,100..900;1,100..900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${inter.className}`}>
        <ConfigProvider
          theme={{
            token: {
              colorPrimary: '#ff4d4f',
              colorBgBase: '#fff',
            },
            components: {
              Layout: {
                siderBg: '#121212',
                triggerBg: '#000',
              },
            }
          }}
        >
          <AntdRegistry>{children}</AntdRegistry>
        </ConfigProvider>
      </body>
    </html>
  );
}
