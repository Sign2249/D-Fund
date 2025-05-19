
export const ProjectStatus = {
    FUNDRAISING: 0,
    IN_PROGRESS: 1,
    COMPLETED: 2,
    FAILED: 3,
    CANCELLED: 4,
  };
  
  const statusLabels = [
    '📢 모금 중',
    '🚧 진행 중',
    '✅ 완료됨',
    '❌ 실패',
    '🚫 취소됨',
  ];
  
  export const getStatusLabel = (statusCode) => {
    return statusLabels[statusCode] || '알 수 없음';
  };
  
  export const isFundableStatus = (statusCode) => {
    return statusCode === ProjectStatus.FUNDRAISING;
  };
  
  export const isProgressStatus = (statusCode) => {
    return statusCode === ProjectStatus.IN_PROGRESS;
  };
  
  export const isCompletedStatus = (statusCode) => {
    return statusCode === ProjectStatus.COMPLETED;
  };
  
  export const isFailedStatus = (statusCode) => {
    return statusCode === ProjectStatus.FAILED;
  };
  
  export const isCancelledStatus = (statusCode) => {
    return statusCode === ProjectStatus.CANCELLED;
  };