const processBackground = (
    file: File,
    targetColor: [number, number, number, number],
    whiteMin: number = 220
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

                // 获取像素数据
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
                const data = imageData.data

                // 处理每个像素
                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i]
                    const g = data[i + 1]
                    const b = data[i + 2]

                    // 判断是否为白色或接近白色
                    if (r >= whiteMin && g >= whiteMin && b >= whiteMin) {
                        // 替换为目标颜色
                        data[i] = targetColor[0]     // R
                        data[i + 1] = targetColor[1] // G
                        data[i + 2] = targetColor[2] // B
                        data[i + 3] = targetColor[3] // A
                    }
                }

                // 将处理后的数据放回 canvas
                ctx.putImageData(imageData, 0, 0)

                // 转换为 Blob
                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            resolve(blob)
                        } else {
                            reject(new Error('背景处理失败'))
                        }
                    },
                    'image/png' // 使用PNG格式以保留透明度
                )
            }

            img.onerror = (err) => reject(err)
        }

        reader.onerror = (err) => reject(err)
        reader.readAsDataURL(file)
    })
}

export default processBackground