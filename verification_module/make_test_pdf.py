import fitz

doc = fitz.open()
page = doc.new_page()
content = """IN THE HIGH COURT OF DELHI
CNR NUMBER: DLHC010012342022
Before: Hon'ble Mr. Justice Ramesh Sharma
Advocate: Senior Counsel Mukul Rohatgi

Citations: AIR 2021 SC 1234, 2020 SCC 45

The court observed: "The basic structure of the Constitution cannot be altered."
"""
page.insert_text((50, 72), content)
doc.save("test_sample.pdf")
doc.close()
print("test_sample.pdf created successfully!")
