// src/features/people/hooks/usePeopleCount.js
import { generateClient } from '@aws-amplify/api';
import { listPeopleCounts } from 'graphql/queries';
import { createPeopleCount, updatePeopleCount } from 'graphql/mutations';

/**
 * 학기별 식사 인원 데이터를 조회하거나 저장하는 커스텀 훅
 * @returns {{ fetchCounts: Function, saveCount: Function }}
 */
export function usePeopleCount() {
  // AWS Amplify GraphQL 클라이언트 생성
  const client = generateClient();

  /**
   * 선택한 연도(year)와 학기(term)의 데이터를 조회합니다.
   * @param {{ year: number, term: string }} params
   * @returns {Promise<Object|null>} 첫 번째 데이터 객체 또는 null
   */
  const fetchCounts = async ({ year, term }) => {
    const res = await client.graphql({
      query: listPeopleCounts,
      variables: { filter: { year: { eq: year }, term: { eq: term } } }
    });
    return res.data.listPeopleCounts.items[0] || null;
  };

  /**
   * 연도, 학기, 인원(count)을 저장하거나 기존 항목을 업데이트합니다.
   * @param {{ year: number, term: string, count: number }} params
   * @returns {Promise<void>}
   */
  const saveCount = async ({ year, term, count }) => {
    const existing = await fetchCounts({ year, term });
    const input = { year, term, count };

    if (existing) {
      await client.graphql({
        query: updatePeopleCount,
        variables: { input: { id: existing.id, ...input } }
      });
    } else {
      await client.graphql({
        query: createPeopleCount,
        variables: { input }
      });
    }
  };

  return { fetchCounts, saveCount };
}
