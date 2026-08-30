/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const getMeal = /* GraphQL */ `
  query GetMeal($id: ID!) {
    getMeal(id: $id) {
      id
      date
      breakfast {
        items
        calories
        protein
        predictedCount
        __typename
      }
      lunch {
        items
        calories
        protein
        predictedCount
        __typename
      }
      dinner {
        items
        calories
        protein
        predictedCount
        __typename
      }
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const listMeals = /* GraphQL */ `
  query ListMeals(
    $filter: ModelMealFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listMeals(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        date
        createdAt
        updatedAt
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const getPeopleCount = /* GraphQL */ `
  query GetPeopleCount($id: ID!) {
    getPeopleCount(id: $id) {
      id
      year
      term
      count
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const listPeopleCounts = /* GraphQL */ `
  query ListPeopleCounts(
    $filter: ModelPeopleCountFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listPeopleCounts(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        year
        term
        count
        createdAt
        updatedAt
        __typename
      }
      nextToken
      __typename
    }
  }
`;
