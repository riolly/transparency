import React from 'react'
import {useRouter} from 'next/router'
import Link from 'next/link'
import {useSession, signIn, signOut} from 'next-auth/react'
import Image from 'next/image'

import Button from '@components/button'
import MenuButton from '@components/menu-button'
import {
	MdArticle as ArticleIcon,
	MdHome as HomeIcon,
	MdLogin as LoginIcon,
	MdLogout as LogoutIcon,
	MdPerson as PersonIcon,
} from 'react-icons/md'

import {capFirstChar} from '@utils/literal'

export default function PlainLayout({children}: {children: React.ReactNode}) {
	const {pathname} = useRouter()
	const routes = [
		{href: '/', label: 'home', icon: <HomeIcon />},
		{href: '/article', label: 'article', icon: <ArticleIcon />},
	]

	const {status, data} = useSession()
	const menuItems = [
		{label: 'Sign out', Icon: LogoutIcon, onClick: () => signOut()},
	]

	return (
		<div className='min-h-screen bg-gradient-to-br from-purple-900 to-gray-900 '>
			<div className='glass flex h-12 w-full items-center justify-between border-t-0 bg-opacity-30 pt-1 underline-offset-4 shadow-sm'>
				<div />
				<nav className='flex h-fit gap-4'>
					{routes.map(({href, label, icon}, i) => {
						const isActive = pathname === href
						return (
							<>
								<Link
									href={href}
									key={label}
									className={`flex items-start gap-2 px-2 font-medium text-gray-50 ${
										isActive ? 'pointer-events-none' : 'hover:underline'
									}`}
								>
									<span
										className={`text-xl ${
											isActive
												? 'rounded-lg bg-gray-200 p-0.5 text-purple-500'
												: ''
										}`}
									>
										{icon}
									</span>
									<span className={isActive ? 'underline' : ''}>
										{capFirstChar(label)}
									</span>
								</Link>
								{i !== routes.length - 1 && (
									<span className='text-white'>&bull;</span>
								)}
							</>
						)
					})}
				</nav>
				<div className='px-4'>
					{status === 'authenticated' ? (
						<MenuButton menuItems={menuItems}>
							{data.user?.image ? (
								<Image
									src={data.user.image}
									alt='user picture'
									width={32}
									height={32}
									className='rounded-full'
								/>
							) : (
								<div className='h-8 w-8 rounded-full bg-white p-1'>
									<PersonIcon className='h-full w-full text-violet-500' />
								</div>
							)}
						</MenuButton>
					) : (
						<Button
							variant='filled'
							className='px-4 py-1.5 font-medium text-gray-200 shadow-sm'
							onClick={() => signIn()}
						>
							Signin <LoginIcon className='text-xl' />
						</Button>
					)}
				</div>
			</div>
			<main className='container mx-auto py-12'>{children}</main>
		</div>
	)
}
