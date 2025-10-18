'use client'

import React from 'react'
import { Analytics } from '@vercel/analytics/react'
import { injectSpeedInsights } from '@vercel/speed-insights'

export function ClientAnalytics (): React.JSX.Element {
		React.useEffect(() => { injectSpeedInsights(); }, []);
	return (
		<>
			<Analytics />
			
		</>
	)
}


