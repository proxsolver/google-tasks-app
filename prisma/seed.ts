/**
 * Prisma 데이터베이스 시드 파일
 *
 * 개발용 초기 데이터 생성
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // 테스트 사용자 생성
  const user = await prisma.user.upsert({
    where: { googleId: 'test-user-123' },
    update: {},
    create: {
      googleId: 'test-user-123',
      email: 'test@example.com',
      name: 'Test User',
      avatar: 'https://example.com/avatar.png',
      accessToken: 'test-access-token',
      settings: {
        create: {
          defaultView: 'eisenhower',
        },
      },
    },
  })

  console.log('✅ Created user:', user.email)

  // 태그 생성
  const tags = await Promise.all([
    prisma.tag.upsert({
      where: { userId_name: { userId: user.id, name: '업무' } },
      update: {},
      create: {
        name: '업무',
        color: '#3B82F6',
        userId: user.id,
      },
    }),
    prisma.tag.upsert({
      where: { userId_name: { userId: user.id, name: '개인' } },
      update: {},
      create: {
        name: '개인',
        color: '#10B981',
        userId: user.id,
      },
    }),
    prisma.tag.upsert({
      where: { userId_name: { userId: user.id, name: '학습' } },
      update: {},
      create: {
        name: '학습',
        color: '#F59E0B',
        userId: user.id,
      },
    }),
  ])

  console.log('✅ Created tags:', tags.length)

  console.log('🎉 Seeding completed!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
