'use client'

import React from 'react'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'

export function ClientAnalytics (): React.JSX.Element {
	return (
		<>
			<Analytics />
			<SpeedInsights />
		</>
	)
}


