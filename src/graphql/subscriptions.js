/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const onCreateMeal = /* GraphQL */ `
  subscription OnCreateMeal($filter: ModelSubscriptionMealFilterInput) {
    onCreateMeal(filter: $filter) {
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
export const onUpdateMeal = /* GraphQL */ `
  subscription OnUpdateMeal($filter: ModelSubscriptionMealFilterInput) {
    onUpdateMeal(filter: $filter) {
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
export const onDeleteMeal = /* GraphQL */ `
  subscription OnDeleteMeal($filter: ModelSubscriptionMealFilterInput) {
    onDeleteMeal(filter: $filter) {
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
export const onCreatePeopleCount = /* GraphQL */ `
  subscription OnCreatePeopleCount(
    $filter: ModelSubscriptionPeopleCountFilterInput
  ) {
    onCreatePeopleCount(filter: $filter) {
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
export const onUpdatePeopleCount = /* GraphQL */ `
  subscription OnUpdatePeopleCount(
    $filter: ModelSubscriptionPeopleCountFilterInput
  ) {
    onUpdatePeopleCount(filter: $filter) {
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
export const onDeletePeopleCount = /* GraphQL */ `
  subscription OnDeletePeopleCount(
    $filter: ModelSubscriptionPeopleCountFilterInput
  ) {
    onDeletePeopleCount(filter: $filter) {
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
