const convertImage = (
    file: File,
    targetFormat: 'jpeg' | 'png' | 'webp',
    quality: number = 0.8
): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()

        reader.onload = (event) => {
            const img = new Image()
            img.src = event.target?.result as string

            img.onload = () => {
                const canvas = document.createElement('canvas')
                const ctx = canvas.getContext('2d')
                if (!ctx) {
                    reject(new Error('无法获取 Canvas 上下文'))
                    return
                }

                // 设置 canvas 尺寸
                canvas.width = img.width
                canvas.height = img.height
                ctx.drawImage(img, 0, 0)

                // 转换为目标格式
                let mimeType: string
                switch (targetFormat) {
                    case 'jpeg':
                        mimeType = 'image/jpeg'
                        break
                    case 'png':
                        mimeType = 'image/png'
                        break
                    case 'webp':
                        mimeType = 'image/webp'
                        break
                    default:
                        mimeType = 'image/jpeg'
                }

                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            resolve(blob)
                        } else {
                            reject(new Error('图片转换失败'))
                        }
                    },
                    mimeType,
                    targetFormat === 'jpeg' || targetFormat === 'webp' ? quality : undefined
                )
            }

            img.onerror = (err) => reject(err)
        }

        reader.onerror = (err) => reject(err)
        reader.readAsDataURL(file)
    })
}

export default convertImage