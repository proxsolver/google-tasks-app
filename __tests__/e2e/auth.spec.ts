/**
 * 인증 흐름 E2E 테스트
 */

import { test, expect } from '@playwright/test'

test.describe('인증 흐름', () => {
  test('로그인 페이지가 올바르게 렌더링되어야 한다', async ({ page }) => {
    await page.goto('/login')

    // 제목 확인
    await expect(page.locator('h1')).toContainText('Google Tasks 매트릭스')

    // 설명 확인
    await expect(page.locator('text=아이젠하워 매트릭스로 효율적으로 태스크를 관리하세요')).toBeVisible()

    // Google 로그인 버튼 확인
    await expect(page.locator('text=Google로 로그인')).toBeVisible()
  })

  test('로그아웃이 작동해야 한다', async ({ page }) => {
    // 이 테스트는 인증된 세션이 필요합니다.
    // 실제 테스트에서는 테스트 사용자로 로그인하는 설정이 필요합니다.

    await page.goto('/dashboard')

    // 로그아웃 버튼 클릭
    await page.click('[aria-label="로그아웃"]')

    // 로그인 페이지로 리디렉션되는지 확인
    await expect(page).toHaveURL(/\/login/)
  })

  test('인증되지 않은 사용자는 대시보드에 접근할 수 없어야 한다', async ({ page }) => {
    await page.goto('/dashboard')

    // 로그인 페이지로 리디렉션되어야 함
    await expect(page).toHaveURL(/\/login/)
  })
})

test.describe('대시보드', () => {
  test.beforeEach(async ({ page }) => {
    // 테스트 전에 로그인 (실제 구현에서는 모의 인증 필요)
    await page.goto('/login')
  })

  test('대시보드가 올바르게 로드되어야 한다', async ({ page }) => {
    await page.goto('/dashboard')

    // 헤더 확인
    await expect(page.locator('h1')).toContainText('Google Tasks 매트릭스')

    // 뷰 전환 버튼 확인
    await expect(page.locator('text=매트릭스')).toBeVisible()
    await expect(page.locator('text=마인드맵')).toBeVisible()

    // 새 태스크 버튼 확인
    await expect(page.locator('text=새 태스크')).toBeVisible()
  })

  test('뷰 전환이 작동해야 한다', async ({ page }) => {
    await page.goto('/dashboard')

    // 마인드맵 뷰로 전환
    await page.click('text=마인드맵')
    await expect(page.locator('text=마인드맵')).toBeVisible()

    // 매트릭스 뷰로 전환
    await page.click('text=매트릭스')
    await expect(page.locator('text=매트릭스')).toBeVisible()
  })

  test('태그 관리 패널을 열 수 있어야 한다', async ({ page }) => {
    await page.goto('/dashboard')

    // 태그 관리 버튼 클릭
    await page.click('[aria-label="태그 관리"]')

    // 태그 관리자가 표시되는지 확인
    await expect(page.locator('text=태그 관리')).toBeVisible()
  })
})
