import { ReactNode } from 'react';
import Sidebar from './layout/Sidebar';
import MainLayout from './layout/MainLayout';

interface LayoutProps {
    children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
    return <MainLayout>{children}</MainLayout>;
}
