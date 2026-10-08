export interface DialogData {
  email: string;
  firstFieldValue?: string;
  secondFieldValue?: string;
}

export interface DialogForm {
  /** Defaults to "First Name". */
  firstFieldLabel?: string;
  firstFieldValue?: string;
  /** Defaults to "Last Name". */
  secondFieldLabel?: string;
  secondFieldValue?: string;
  /** Defaults to "Subscribe". */
  submitLabel?: string;
  title: string;
  submit: (data: DialogData) => void;
}
