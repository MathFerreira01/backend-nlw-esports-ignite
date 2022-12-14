import express from 'express'
import cors from 'cors'

import { PrismaClient } from '@prisma/client'
import { convertHourStringToMinutes } from './utils/convert-hout-string-to-minutes'
import { convertMinutesToHourString } from './utils/convert-minutes-to-hour-string'

const app = express()

app.use(express.json())
app.use(cors())

const prisma = new PrismaClient({
    log: ['query']
})

app.get('/games', async (request, response) => {
    const games = await prisma.game.findMany({
        include: {
            _count: {
                select: {
                    ads: true,
                }
            }
        }
    })

    return response.json(games)
})

app.post('/games/:id/ads',async(request,response)=>{
    const gameId = request.params.id;
    const body:any = request.body;

    const ad = await prisma.ad.create({
        data:{
            gameId,
            name:body.name,
            yearsPlaying:body.yearsPlaying,
            discord:body.discord,
            weekDays:body.weekDays.join(','),
            hourStart:convertHourStringToMinutes(body.hourStart),
            hourEnd:convertHourStringToMinutes(body.hourEnd),
            useVoiceChannel:body.useVoiceChannel,
        }
    })

    return response.status(201).json(ad);
});

app.get('/games/:id/ads', async (resquest, response) => {

   const gameId = resquest.params.id;

   const ads = await prisma.ad.findMany({
    select: {
        id: true,
        name: true,
        weekDays: true,
        useVoiceChannel: true,
        yearsPlaying: true,
        hourStart: true,
        hourEnd: true,
    },
    where: {
        gameId,
    },
    orderBy: {
        createAt: 'desc',
    }
})

    return response.json(ads.map( (ad: { weekDays: string; hourStart: number; hourEnd: number }) => {
        return {
            ...ad,
            weekDays: ad.weekDays.split(','),
            hourStar: convertMinutesToHourString(ad.hourStart),
            hourEnd: convertMinutesToHourString(ad.hourEnd)
        }
    }))
})

app.get('/ads/:id/discord', async (resquest, response) => {

    const adId = resquest.params.id;

    const ad = await prisma.ad.findUniqueOrThrow({
        select: {
            discord: true,
        },
        where: {
            id: adId,
        }
    })
 
     return response.json({
        discord: ad.discord,
     })
 })

app.listen( process.env.PORT || 3333)