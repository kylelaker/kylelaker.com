export interface ReportToHeaderProps {
  readonly group: string;
  readonly maxAge: number;
  readonly urls: string[];
  readonly includeSubdomains: boolean;
}

export class ReportToHeader {
  #data: ReportToHeaderProps;

  constructor(props: ReportToHeaderProps) {
    this.#data = {
      ...props,
      urls: [...props.urls],
    };
  }

  public get groupName(): string {
    return this.#data.group;
  }

  public get maxAge(): number {
    return this.#data.maxAge;
  }

  public get includeSubdomains(): boolean {
    return this.#data.includeSubdomains;
  }

  public toJSON(): object {
    return {
      group: this.#data.group,
      max_age: this.#data.maxAge,
      include_subdomains: this.#data.includeSubdomains,
      endpoints: this.#data.urls.map((url) => ({ url })),
    };
  }
}
