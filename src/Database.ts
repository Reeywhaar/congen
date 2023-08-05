import { createSortHandler } from "./tools";

export class Database {
  private db!: IDBDatabase;
  async initialize() {
    this.db = await new Promise<IDBDatabase>((resolve, reject) => {
      try {
        const req = indexedDB.open("database", 1);

        req.onupgradeneeded = function () {
          const db = this.result;
          if (!db.objectStoreNames.contains("images")) {
            db.createObjectStore("images", { keyPath: "id" });
          }
        };

        req.onsuccess = function () {
          resolve(this.result);
        };

        req.onerror = () => {
          reject("Failed to open database");
        };

        req.onblocked = () => {
          reject("Database open was blocked");
        };
      } catch (err) {
        reject(err);
      }
    });
  }

  async addImage(image: File): Promise<DatabaseFile> {
    const data = await this.readImage(image);
    const tx = this.db.transaction("images", "readwrite");
    const id = Math.random().toString(36).substring(2, 11);
    tx.objectStore("images").add({
      id,
      name: image.name,
      data,
      addedAt: Date.now(),
    } satisfies SerializedFile);
    tx.commit();
    const out = image as DatabaseFile;
    out.dbid = id;
    return out;
  }

  async getImages() {
    const tx = this.db.transaction("images", "readwrite");

    return new Promise<DatabaseFile[]>((resolve) => {
      tx.objectStore("images").getAll().onsuccess = function () {
        resolve(
          (this.result as SerializedFile[])
            .sort(createSortHandler((x) => [-x.addedAt]))
            .map((x) => {
              let file = new File(
                [new Uint8Array(x.data)],
                x.name,
              ) as DatabaseFile;
              file.dbid = x.id;
              return file;
            }),
        );
      };
    });
  }

  private readImage(file: File) {
    return new Promise<number[]>((resolve, reject) => {
      var reader = new FileReader();
      reader.addEventListener(
        "load",
        function () {
          var string: string =
            (this as any).resultString != null
              ? (this as any).resultString
              : (this.result as string);
          var result = new Uint8Array(string.length);
          for (var i = 0; i < string.length; i++) {
            result[i] = string.charCodeAt(i);
          }
          resolve(Array.from(result));
        },
        false,
      );
      reader.addEventListener("error", (e) => {
        reject(new Error(`Can't read file: ${e.type}`));
      });

      reader.readAsBinaryString(file);
    });
  }
}

type SerializedFile = {
  id: string;
  name: string;
  data: number[];
  addedAt: number;
};

export type DatabaseFile = File & {
  dbid: string;
};
