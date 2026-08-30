/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const createMeal = /* GraphQL */ `
  mutation CreateMeal(
    $input: CreateMealInput!
    $condition: ModelMealConditionInput
  ) {
    createMeal(input: $input, condition: $condition) {
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
export const updateMeal = /* GraphQL */ `
  mutation UpdateMeal(
    $input: UpdateMealInput!
    $condition: ModelMealConditionInput
  ) {
    updateMeal(input: $input, condition: $condition) {
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
export const deleteMeal = /* GraphQL */ `
  mutation DeleteMeal(
    $input: DeleteMealInput!
    $condition: ModelMealConditionInput
  ) {
    deleteMeal(input: $input, condition: $condition) {
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
export const createPeopleCount = /* GraphQL */ `
  mutation CreatePeopleCount(
    $input: CreatePeopleCountInput!
    $condition: ModelPeopleCountConditionInput
  ) {
    createPeopleCount(input: $input, condition: $condition) {
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
export const updatePeopleCount = /* GraphQL */ `
  mutation UpdatePeopleCount(
    $input: UpdatePeopleCountInput!
    $condition: ModelPeopleCountConditionInput
  ) {
    updatePeopleCount(input: $input, condition: $condition) {
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
export const deletePeopleCount = /* GraphQL */ `
  mutation DeletePeopleCount(
    $input: DeletePeopleCountInput!
    $condition: ModelPeopleCountConditionInput
  ) {
    deletePeopleCount(input: $input, condition: $condition) {
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
