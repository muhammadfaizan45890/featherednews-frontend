// import Footer from '@/components/Footer'
import Hero from '@/components/Hero'
import HNews from '@/components/HNews'
import LatestStories from '@/components/LatestStories'
import React from 'react'
import FeaturedStories from './FeaturedStories'

const Home = () => {
  return (
    <div>
      <Hero/>
      <FeaturedStories/>
      <LatestStories/>
      <HNews/>
      {/* <Footer/> */}
    </div>
  )
}

export default Home
