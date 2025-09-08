"use client"

import Link from 'next/link'
import React, { useEffect, useRef } from 'react'
import { Button } from './ui/button'
import Image from 'next/image'

const HeroSection = () => {
    const imageRef = useRef(null)

    useEffect(() => {
        const imageElement = imageRef.current;

        const handleScroll = () => {
            if (imageElement) {
                const scrollPosition = window.scrollY;
                const scrollThreshold = 100; // Adjust this value to control when the effect starts

                if(scrollPosition > scrollThreshold) {
                    imageElement.classList.add("scrolled");
                } else {
                    imageElement.classList.remove("scrolled");
                }
            }
        };

        window.addEventListener("scroll", handleScroll)

        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

  return (
    <div className='pb-20 px-4'>
        <div className='container mx-auto text-center'>
            <h1 className='text-5xl md:text-8xl lg:text-[105px] pb-6 gradient-title'>
                Manage Your Finance <br /> with Intelligence
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                An AI-powered personal finance platform that helps you track, manage, and optimize your financial life with ease.
            </p>
            <div className='flex justify-center space-x-4'>
                <Link href="/dashboard">
                    <Button size='lg' className="px-8">Get Started</Button>
                </Link>
                <Link href="https://youtu.be/7xMk1vZxPKg?si=Dj9ezfXTOzCZrA-h">
                    <Button size='lg' variant='outline' className="px-8">Watch Demo</Button>
                </Link>
            </div>
            <div className='hero-image-wrapper'>
                <div ref={imageRef} className='hero-image'>
                    <Image src="/banner.webp" alt="Banner Image" width={1280} height={720} className='rounded-lg shadow-2xl border mx-auto' priority />
                </div>
            </div>
        </div>
    </div>
  )
}

export default HeroSection
