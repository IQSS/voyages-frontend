export interface ContributeOpenSideBarProp {
  openSideBar: boolean;
}

export interface BatchFormData {
  title: string;
  comments: string;
}

export interface BatchManagementProps {
  visible: boolean;
  onClose: () => void;
  onBatchAssigned?: () => void;
}
