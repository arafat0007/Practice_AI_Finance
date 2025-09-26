import React, { Suspense } from 'react'
import DashboardPage from './page'
import { BarLoader } from 'react-spinners'

const DashboardLayout = () => {
  return (
    <div className='px-5'>
        <h1 className='text-6xl font-bold gradient-title mb-5'>Dashboard</h1>

        <Suspense fallback={<BarLoader className='mt-4' color="#3b82f6" width="100%" />}>
            <DashboardPage />
        </Suspense>
    </div>
  )
}

export default DashboardLayout
